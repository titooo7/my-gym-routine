import React, { useState, useCallback } from 'react';
import { RoutineForm } from './components/RoutineForm';
import { RoutineDisplay } from './components/RoutineDisplay';
import { SwapModal } from './components/SwapModal';
import { UserPreferences, WorkoutPlan, Exercise, DayRoutine } from './types';
import { generateWorkoutRoutine } from './services/geminiService';
import { Dumbbell } from 'lucide-react';

export default function App() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  
  // Swap Modal State
  const [swapTarget, setSwapTarget] = useState<Exercise | null>(null);

  const handleGenerate = async (prefs: UserPreferences) => {
    setIsLoading(true);
    setUserPrefs(prefs);
    setWorkoutPlan(null); // Clear previous
    try {
      const plan = await generateWorkoutRoutine(prefs);
      setWorkoutPlan(plan);
    } catch (error) {
      console.error("Failed to generate plan", error);
      alert("Failed to generate routine. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapRequest = useCallback((exercise: Exercise) => {
    setSwapTarget(exercise);
  }, []);

  const handleSwapComplete = (original: Exercise, newExercise: Exercise) => {
    if (!workoutPlan) return;

    // Create a deep copy of the plan to update it immutably
    const updatedSchedule = workoutPlan.schedule.map((day: DayRoutine) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        if (ex === original) { 
           return newExercise;
        }
        return ex;
      })
    }));

    setWorkoutPlan({
      ...workoutPlan,
      schedule: updatedSchedule
    });
    setSwapTarget(null);
  };

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
               <Dumbbell className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              GeminiFit
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24">
              <RoutineForm onSubmit={handleGenerate} isLoading={isLoading} />
              
              {!workoutPlan && !isLoading && (
                <div className="mt-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <p className="text-slate-500 text-sm">
                    Enter your preferences above to generate a custom workout plan tailored to your goals.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-8 xl:col-span-9 min-h-[500px]">
            {isLoading ? (
               <div className="h-full flex flex-col items-center justify-center space-y-6 text-slate-500">
                 <div className="relative">
                   <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                   <div className="absolute top-0 w-20 h-20 border-4 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin"></div>
                 </div>
                 <p className="animate-pulse font-medium">Crafting your perfect routine...</p>
               </div>
            ) : workoutPlan ? (
              <RoutineDisplay plan={workoutPlan} onSwapRequest={handleSwapRequest} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Dumbbell className="w-24 h-24 text-slate-800" />
                <h2 className="text-2xl font-bold text-slate-700">Ready to Train?</h2>
                <p className="text-slate-600 max-w-md">
                  Fill out the form on the left to get started with a personalized workout routine.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {swapTarget && userPrefs && (
        <SwapModal 
          exercise={swapTarget} 
          injuries={userPrefs.injuries} 
          onClose={() => setSwapTarget(null)}
          onSelect={handleSwapComplete}
        />
      )}
    </div>
  );
}