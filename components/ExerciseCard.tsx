import React, { useState } from 'react';
import { Exercise } from '../types';
import { RefreshCw, ClipboardList, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ExerciseDetails } from './ExerciseDetails';

interface ExerciseCardProps {
  exercise: Exercise;
  onSwap: (exercise: Exercise) => void;
  index: number;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSwap, index }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-4 transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs text-slate-300 font-mono">
              {index + 1}
            </span>
            <h4 className="text-lg font-semibold text-slate-100">{exercise.name}</h4>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400 pl-9">
            <span className="bg-slate-900/50 px-2 py-1 rounded text-emerald-400 font-medium">
              {exercise.sets} Sets
            </span>
            <span className="bg-slate-900/50 px-2 py-1 rounded text-blue-400 font-medium">
              {exercise.reps} Reps
            </span>
            <span className="bg-slate-900/50 px-2 py-1 rounded text-purple-400 font-medium">
              {exercise.muscleGroup}
            </span>
          </div>
          {exercise.notes && (
            <p className="mt-3 text-sm text-slate-500 pl-9 italic flex items-start gap-1">
              <ClipboardList className="w-3 h-3 mt-1 flex-shrink-0" />
              {exercise.notes}
            </p>
          )}

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="pl-9 mt-2">
              <button 
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-500/80 hover:text-emerald-400 transition-colors"
              >
                <Info className="w-3 h-3" />
                {showInstructions ? "Hide Instructions" : "How to perform"}
                {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showInstructions && (
                <ExerciseDetails name={exercise.name} instructions={exercise.instructions} />
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onSwap(exercise)}
          title="Find alternative exercise"
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};