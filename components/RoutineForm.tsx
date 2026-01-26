import React, { useState, useEffect } from 'react';
import { UserPreferences, GoalType, SplitType } from '../types';
import { Dumbbell, Activity, AlertCircle, Layers } from 'lucide-react';

interface RoutineFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'geminiFit_userPrefs';

const DEFAULT_PREFS: UserPreferences = {
  daysPerWeek: 4,
  maxConsecutiveRestDays: 2,
  goal: GoalType.HYPERTROPHY,
  splitType: SplitType.SPLIT,
  focusAreas: '',
  injuries: '',
};

export const RoutineForm: React.FC<RoutineFormProps> = ({ onSubmit, isLoading }) => {
  // Initialize state from localStorage if available
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Merge with defaults to ensure all fields exist (in case of structure updates)
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load preferences from local storage', e);
    }
    return DEFAULT_PREFS;
  });

  // Save to local storage whenever prefs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save preferences to local storage', e);
    }
  }, [prefs]);

  const handleChange = (field: keyof UserPreferences, value: string | number) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prefs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-white">Setup Your Plan</h2>
      </div>

      {/* Days Per Week */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Training Days / Week: <span className="text-emerald-400 font-bold">{prefs.daysPerWeek}</span>
        </label>
        <input
          type="range"
          min="1"
          max="7"
          value={prefs.daysPerWeek}
          onChange={(e) => handleChange('daysPerWeek', parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 Day</span>
          <span>7 Days</span>
        </div>
      </div>

      {/* Routine Structure (Split vs Full Body) */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Routine Structure
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleChange('splitType', SplitType.SPLIT)}
            className={`p-3 rounded-lg text-sm transition-all border ${
              prefs.splitType === SplitType.SPLIT
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-750'
            }`}
          >
            Body Part Split
          </button>
          <button
            type="button"
            onClick={() => handleChange('splitType', SplitType.FULL_BODY)}
            className={`p-3 rounded-lg text-sm transition-all border ${
              prefs.splitType === SplitType.FULL_BODY
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-750'
            }`}
          >
            Full Body
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {prefs.splitType === SplitType.SPLIT 
            ? "Focus on specific muscle groups each day (e.g., Upper/Lower, PPL)." 
            : "Train the entire body every session. Best for 2-4 days/week."}
        </p>
      </div>

      {/* Max Rest Days */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Max Consecutive Rest Days</label>
        <select
          value={prefs.maxConsecutiveRestDays}
          onChange={(e) => handleChange('maxConsecutiveRestDays', parseInt(e.target.value))}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value={1}>1 Day</option>
          <option value={2}>2 Days</option>
          <option value={3}>3 Days</option>
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">Primary Goal</label>
        <div className="grid grid-cols-1 gap-2">
          {Object.values(GoalType).map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => handleChange('goal', goal)}
              className={`p-3 rounded-lg text-sm text-left transition-all border ${
                prefs.goal === goal
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-800 border-transparent text-slate-300 hover:bg-slate-750'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Focus Areas (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Upper Chest, Calves, Rear Delts"
          value={prefs.focusAreas}
          onChange={(e) => handleChange('focusAreas', e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-500"
        />
      </div>

      {/* Injuries */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" /> Injuries / Limitations (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Lower back pain, bad left knee"
          value={prefs.injuries}
          onChange={(e) => handleChange('injuries', e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          isLoading
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/20'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Plan...
          </span>
        ) : (
          "Generate Routine"
        )}
      </button>
    </form>
  );
};