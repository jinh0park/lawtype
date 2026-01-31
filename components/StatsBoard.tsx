import React from 'react';
import { TypingStats } from '../types';

export const StatsBoard: React.FC<{ stats: TypingStats }> = ({ stats }) => {
  return (
    <div className="flex w-full max-w-5xl mx-auto mb-8 gap-6 md:gap-12 px-4 justify-end">
      <div className="flex flex-col items-end">
        <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Speed</span>
        <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-mono font-bold text-slate-800 tracking-tighter">
            {stats.cpm}
            </span>
            <span className="text-slate-400 text-xs font-medium">CPM</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Accuracy</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-3xl md:text-4xl font-mono font-bold tracking-tighter transition-colors duration-300 ${stats.accuracy < 90 ? 'text-red-500' : 'text-slate-800'}`}>
            {stats.accuracy}
            </span>
            <span className="text-slate-400 text-xs font-medium">%</span>
        </div>
      </div>
    </div>
  );
};