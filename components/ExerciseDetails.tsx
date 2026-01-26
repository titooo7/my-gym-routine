import React, { useState, useEffect } from 'react';
import { ExternalLink, PlayCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getExerciseImage } from '../services/geminiService';

interface ExerciseDetailsProps {
  name: string;
  instructions: string[];
}

export const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ name, instructions }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      setLoading(true);
      try {
        const url = await getExerciseImage(name);
        if (isMounted) setImageUrl(url);
      } catch (err) {
        console.error("Failed to load image", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [name]);

  const videoSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise tutorial")}`;

  return (
    <div className="mt-3 text-sm text-slate-400 bg-slate-900/40 p-4 rounded-lg border border-slate-800/50 space-y-4 animate-in fade-in slide-in-from-top-1">
      {/* Step by Step Instructions */}
      <div className="space-y-3">
        <h4 className="text-emerald-400 font-medium text-xs uppercase tracking-wider">Step-by-Step Execution</h4>
        <ol className="space-y-2">
          {instructions.map((step, idx) => (
            <li key={idx} className="flex gap-3 text-slate-300">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-xs font-mono border border-slate-700">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      
      {/* Exercise Image */}
      <div className="relative w-full aspect-square max-w-[300px] mx-auto bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs">Generating Visual...</span>
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${name} illustration`} 
            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-700">
            <ImageIcon className="w-10 h-10 opacity-30" />
            <span className="text-xs">No visual available</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-800/50">
        <a 
          href={videoSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors group"
        >
          <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Watch Tutorial on YouTube
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      </div>
    </div>
  );
};