import React, { useEffect, useState } from 'react';
import { Exercise } from '../types';
import { getExerciseAlternatives } from '../services/geminiService';
import { X, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';

interface SwapModalProps {
  exercise: Exercise;
  injuries: string;
  onClose: () => void;
  onSelect: (original: Exercise, newExercise: Exercise) => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({ exercise, injuries, onClose, onSelect }) => {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track which alternative is currently expanded (accordion style)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        const alts = await getExerciseAlternatives(exercise, injuries);
        setAlternatives(alts);
      } catch (err) {
        setError("Failed to fetch alternatives. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlternatives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, injuries]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(current => current === idx ? null : idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-white">Swap Exercise</h3>
            <p className="text-sm text-slate-400">Alternatives for <span className="text-emerald-400">{exercise.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 animate-pulse">Consulting expert knowledge...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 bg-red-900/10 rounded-xl border border-red-900/50">
              <p>{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-white text-sm"
              >
                Close
              </button>
            </div>
          ) : alternatives.length === 0 ? (
             <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
              <p>No suitable alternatives found given the constraints.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alternatives.map((alt, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div 
                    key={idx}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                      isExpanded 
                        ? 'bg-slate-800 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/20' 
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold transition-colors ${isExpanded ? 'text-white' : 'text-slate-200'}`}>{alt.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-slate-900/50 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
                              {alt.sets} Sets
                            </span>
                            <span className="text-xs bg-slate-900/50 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
                              {alt.reps} Reps
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="h-px bg-slate-700/50 w-full mb-4" />
                        
                        {/* Rationale Section */}
                        <div className="bg-emerald-900/10 p-3 rounded-lg border border-emerald-900/20">
                          <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Why this choice</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed pl-1">{alt.notes}</p>
                        </div>

                        {/* Instructions Section */}
                        {alt.instructions && alt.instructions.length > 0 && (
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block pl-1">How to perform</span>
                            <ol className="list-decimal list-inside text-sm text-slate-400 leading-relaxed pl-1 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 space-y-2">
                              {alt.instructions.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => onSelect(exercise, alt)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Select This Alternative
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-white transition-colors">Cancel Swap</button>
        </div>
      </div>
    </div>
  );
};