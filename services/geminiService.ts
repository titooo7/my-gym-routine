import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserPreferences, WorkoutPlan, Exercise, GoalType, SplitType } from "../types";

// API Key is strictly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Corrected model names: Flash Preview for Text, Flash Image for Images (Free Tier compatible)
const modelName = "gemini-3-flash-preview";
const imageModelName = "gemini-2.5-flash-image";

// --- PERSISTENCE LAYER (IndexedDB) ---
// Since web apps cannot write to server-side directories at runtime, 
// we use IndexedDB to store images persistently on the client's device.
const DB_NAME = 'GeminiFitDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getCachedImageFromDB = async (key: string): Promise<string | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to read from cache DB:", error);
    return undefined;
  }
};

const saveImageToDB = async (key: string, data: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to save to cache DB:", error);
  }
};

// In-memory L1 cache for current session speed
const exerciseImageCache = new Map<string, string>();

const getGoalSpecificInstructions = (goal: string): string => {
  switch (goal) {
    case GoalType.HYPERTROPHY:
      return "Focus on 8-12 rep range, progressive overload, and hitting all muscle groups evenly.";
    case GoalType.GLUTE_AND_SHAPE:
      return "Design a routine with high volume for glutes and hamstrings (hip thrusts, RDLs, lunges). For the upper body, focus on 'toning' rep ranges (12-15 reps) for shoulders and back to create an hourglass illusion, but minimize heavy trap or pec isolation work.";
    case GoalType.METABOLIC_CONDITIONING:
      return "Create a routine that utilizes supersets, circuits, or AMRAPs. Keep rest periods short (30-60s) to keep the heart rate elevated. Focus on compound movements that recruit large muscle groups to maximize caloric expenditure.";
    case GoalType.MAX_STRENGTH:
      return "Focus on the big 3/4 compound lifts (Squat, Bench, Deadlift, Overhead Press). Lower rep ranges (1-5 reps), longer rest periods (3-5 mins), high intensity relative to 1RM.";
    case GoalType.FUNCTIONAL_HYBRID:
      return "Incorporate unilateral movements, plyometrics, and core stability. Focus on movement quality and explosive power rather than just 1RM strength. Mix resistance training with mobility work.";
    case GoalType.LONGEVITY:
      return "Focus on joint health, mobility, and moderate resistance. Prioritize safety and sustainable movement patterns over heavy loading.";
    default:
      return "Focus on balanced general health and fitness.";
  }
};

export const generateWorkoutRoutine = async (prefs: UserPreferences): Promise<WorkoutPlan> => {
  const goalInstructions = getGoalSpecificInstructions(prefs.goal);
  
  // Logic to guide the LLM on how to interpret the requested split
  const splitContext = prefs.splitType === SplitType.FULL_BODY
    ? "The user explicitly requested a FULL BODY routine. Every session MUST target the entire body (e.g. Squat/Hinge, Push, Pull, Carry/Core). Do not split by body parts."
    : "The user explicitly requested a SPLIT routine. Divide the body parts logically across the available days (e.g. Upper/Lower for 4 days, PPL for 6 days, or Push/Pull/FullBody for 3 days).";

  const prompt = `
    Create a detailed weekly gym routine based on the following user preferences:
    - Training Days per Week: ${prefs.daysPerWeek}
    - Maximum Consecutive Rest Days: ${prefs.maxConsecutiveRestDays}
    - Routine Structure: ${prefs.splitType}
    - Primary Goal: ${prefs.goal}
    - Focus Areas (Undeveloped body parts): ${prefs.focusAreas || "None"}
    - Injuries/Limitations: ${prefs.injuries || "None"}

    CRITICAL INJURY SAFETY CHECK:
    The user has reported the following injuries: "${prefs.injuries || "None"}".
    - You must perform a safety validation for every single exercise selected.
    - If an exercise typically aggravates the listed injury (e.g., Barbell Squats for "bad knees"), you MUST replace it with a joint-friendly alternative (e.g., Reverse Lunges or Leg Press) or remove it.
    - Do not list exercises that are widely known to be high-risk for the specific reported injury.
    - If you make a substitution for safety, mention "injury-friendly variation" in the notes.

    IMPORTANT INSTRUCTIONS:
    1. ROUTINE STRUCTURE: ${splitContext}
    2. Include rest days explicitly in the schedule to match a 7-day cycle.
    3. Provide specific sets and rep ranges aligned with the goal.
    4. Provide clear, step-by-step execution instructions (3-5 steps) for every exercise.
    5. SPECIFIC GOAL STRATEGY: ${goalInstructions}
  `;

  const exerciseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      sets: { type: Type.STRING },
      reps: { type: Type.STRING },
      muscleGroup: { type: Type.STRING },
      notes: { type: Type.STRING },
      instructions: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 3-5 distinct steps to perform the exercise safely. E.g. '1. Stand shoulder width apart', '2. Lower slowly'."
      },
    },
    required: ["name", "sets", "reps", "muscleGroup", "instructions"],
  };

  const daySchema: Schema = {
    type: Type.OBJECT,
    properties: {
      dayName: { type: Type.STRING, description: "e.g., Day 1, Day 2, or Monday" },
      focus: { type: Type.STRING, description: "Main focus of the day, e.g., Chest & Triceps, or Rest" },
      isRestDay: { type: Type.BOOLEAN },
      exercises: { 
        type: Type.ARRAY, 
        items: exerciseSchema
      },
    },
    required: ["dayName", "focus", "isRestDay", "exercises"],
  };

  const planSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      planName: { type: Type.STRING },
      description: { type: Type.STRING },
      schedule: {
        type: Type.ARRAY,
        items: daySchema,
      },
    },
    required: ["planName", "description", "schedule"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as WorkoutPlan;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getExerciseAlternatives = async (
  originalExercise: Exercise,
  userInjuries: string
): Promise<Exercise[]> => {
  const prompt = `
    The user wants to swap out the exercise "${originalExercise.name}" which targets the ${originalExercise.muscleGroup}.
    
    Target Muscle Group: ${originalExercise.muscleGroup}
    Original Volume: ${originalExercise.sets} sets x ${originalExercise.reps} reps
    User's Reported Injuries: "${userInjuries || "None"}"

    Your Goal:
    Suggest 3 alternative exercises that target the same muscle group but are biomechanically distinct or use different equipment.

    INJURY SAFETY PROTOCOL:
    The user has reported the following injuries: "${userInjuries || "None"}".
    1. You MUST evaluate each alternative against these injuries.
    2. If an exercise is known to aggravate the reported injury (e.g. Squats for bad knees, Overhead press for shoulder impingement), DO NOT suggest it.
    3. In the 'notes' field for each alternative, you MUST explain WHY this specific exercise is a safer option for their injury (e.g. "Leg Press provides back support which protects the lumbar spine compared to Barbell Squats").
    4. If no injuries are reported, use the 'notes' field to explain the benefit of this variation (e.g. "Focuses more on the peak contraction").

    Output requirements:
    - 3 distinct exercises.
    - Adjust sets and reps if the nature of the exercise changes (e.g. isolation movements often require higher reps than compounds).
    - Provide 3-5 concise, step-by-step execution instructions.
  `;

  const exerciseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      sets: { type: Type.STRING },
      reps: { type: Type.STRING },
      muscleGroup: { type: Type.STRING },
      notes: { type: Type.STRING, description: "Explanation of why this is a good alternative, specifically addressing injury safety if applicable." },
      instructions: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of 3-5 distinct steps to perform the exercise safely."
      },
    },
    required: ["name", "sets", "reps", "muscleGroup", "notes", "instructions"],
  };

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: exerciseSchema,
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Exercise[];
  } catch (error) {
    console.error("Gemini API Error (Alternatives):", error);
    throw error;
  }
};

export const getExerciseImage = async (exerciseName: string): Promise<string | null> => {
  // 1. Check Memory Cache (L1)
  if (exerciseImageCache.has(exerciseName)) {
    return exerciseImageCache.get(exerciseName)!;
  }

  // 2. Check Persistent Storage (L2 - IndexedDB)
  const cachedFromDB = await getCachedImageFromDB(exerciseName);
  if (cachedFromDB) {
    // Populate L1 cache for subsequent fast access
    exerciseImageCache.set(exerciseName, cachedFromDB);
    return cachedFromDB;
  }

  // 3. Generate via API
  // Strictly enforce photorealistic style to avoid cartoons/illustrations
  const prompt = `
    Generate a professional, photorealistic studio photograph of a fitness model performing the "${exerciseName}" exercise.
    
    REQUIREMENTS:
    - Style: High-quality sports photography, 8k resolution, highly detailed, cinematic lighting.
    - Subject: A fit individual showing correct anatomical form.
    - Background: Clean, neutral studio background (white or light grey).
    - NOT ALLOWED: Do not produce cartoons, vector art, 3D renders, drawings, or abstract illustrations. The image must look like a real photo.
  `;

  try {
    // Switch back to generateContent for gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: imageModelName,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${base64String}`;
          
          // Cache the result in both L1 (Memory) and L2 (Persistent)
          exerciseImageCache.set(exerciseName, dataUrl);
          // Fire and forget save
          saveImageToDB(exerciseName, dataUrl).catch(e => console.error("Background save failed", e));
          
          return dataUrl;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn("Image generation failed for:", exerciseName, error);
    return null;
  }
};
