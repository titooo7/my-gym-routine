export interface Exercise {
  id?: string; // transient ID for UI handling
  name: string;
  sets: string;
  reps: string;
  muscleGroup: string;
  notes: string;
  instructions?: string[];
}

export interface DayRoutine {
  dayName: string;
  focus: string; // e.g., "Push", "Legs", "Rest"
  isRestDay: boolean;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  planName: string;
  description: string;
  schedule: DayRoutine[];
}

export enum SplitType {
  FULL_BODY = "Full Body (Whole Body Every Session)",
  SPLIT = "Body Part Split (e.g. Upper/Lower, PPL)"
}

export interface UserPreferences {
  daysPerWeek: number;
  maxConsecutiveRestDays: number;
  goal: string;
  splitType: SplitType;
  focusAreas: string;
  injuries: string;
}

export enum GoalType {
  HYPERTROPHY = "Muscle Building (Hypertrophy)",
  GLUTE_AND_SHAPE = "Glute Focus & Definition",
  METABOLIC_CONDITIONING = "Lean & Fit (Metabolic Conditioning)",
  MAX_STRENGTH = "Max Strength & Power",
  FUNCTIONAL_HYBRID = "Functional Fitness & Agility",
  LONGEVITY = "Longevity & General Health"
}