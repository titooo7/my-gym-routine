import React from 'react';
import { WorkoutPlan, Exercise, DayRoutine } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { CalendarDays, Moon } from 'lucide-react';

interface RoutineDisplayProps {
  plan: WorkoutPlan;
  onSwapRequest: (exercise: Exercise) => void;
}

export const RoutineDisplay: React.FC<RoutineDisplayProps> = ({ plan, onSwapRequest }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-white mb-2">{plan.planName}</h2>
        <p className="text-slate-400 leading-relaxed">{plan.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {plan.schedule.map((day: DayRoutine, dayIndex: number) => (
          <div 
            key={dayIndex} 
            className={`rounded-2xl border overflow-hidden transition-all ${
              day.isRestDay 
                ? 'bg-slate-900/30 border-slate-800' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className={`p-4 border-b ${day.isRestDay ? 'border-slate-800 bg-slate-800/20' : 'border-slate-800 bg-slate-800/50'} flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${day.isRestDay ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {day.isRestDay ? <Moon className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{day.dayName}</h3>
                  <p className="text-sm text-slate-400 font-medium">{day.focus}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {day.isRestDay ? (
                <div className="py-6 text-center text-slate-500 italic">
                  Rest & Recover. Light stretching or walking recommended.
                </div>
              ) : (
                day.exercises.map((exercise, exIndex) => (
                  <ExerciseCard 
                    key={`${dayIndex}-${exIndex}-${exercise.name}`} // Use a stable key usually, but name works for this context
                    exercise={exercise} 
                    index={exIndex}
                    onSwap={onSwapRequest}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
