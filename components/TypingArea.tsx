import React, { useState, useEffect, useRef } from 'react';
import { TypingStats, SentenceResult } from '../types';
import { isEquivalentChar, isHangulPartialMatch } from '../utils/textUtils';

interface TypingAreaProps {
  sentence: string;
  onComplete: (result: SentenceResult) => void;
  onProgress: (stats: TypingStats) => void;
}

export const TypingArea: React.FC<TypingAreaProps> = ({ sentence, onComplete, onProgress }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when sentence changes
  useEffect(() => {
    setInput('');
    setStartTime(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [sentence]);

  const calculateStats = (currentInput: string): TypingStats => {
    const now = Date.now();
    const start = startTime || now;
    const elapsedSeconds = Math.max((now - start) / 1000, 1);
    
    // Calculate Speed (CPM)
    // We base CPM on the length of input provided
    const cpm = Math.round((currentInput.length / elapsedSeconds) * 60);
    
    // Calculate Accuracy
    let correctChars = 0;
    // Iterate up to the length of the shorter string to avoid out-of-bounds
    const checkLen = Math.min(currentInput.length, sentence.length);
    
    for (let i = 0; i < checkLen; i++) {
      const charInput = currentInput[i];
      const charTarget = sentence[i];
      // Use equivalent check (e.g. '1' == '①') for accuracy calculation
      if (isEquivalentChar(charInput, charTarget)) {
        correctChars++;
      }
    }
    
    const accuracy = currentInput.length > 0 
      ? Math.round((correctChars / currentInput.length) * 100) 
      : 100;

    return {
      cpm,
      accuracy,
      timeElapsed: elapsedSeconds,
      totalErrors: currentInput.length - correctChars,
      progress: Math.min((currentInput.length / sentence.length) * 100, 100)
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setInput(val);
    onProgress(calculateStats(val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Skip Shortcut: Ctrl + Enter or Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onComplete({
        original: sentence,
        typed: input,
        cpm: 0,
        accuracy: 0
      });
      return;
    }

    if (e.key === 'Enter') {
      // Loose check for length (90%)
      if (input.length >= sentence.length * 0.9) {
         const stats = calculateStats(input);
         onComplete({
            original: sentence,
            typed: input,
            cpm: stats.cpm,
            accuracy: stats.accuracy
         });
      }
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Determine font size based on length
  // Default (Short): text-3xl md:text-[2.5rem] (100%)
  // Medium (~150 chars): approx 80% of 2.5rem -> ~2rem (text-2xl or custom)
  // Hard (>250 chars): approx 60% of 2.5rem -> ~1.5rem (text-xl)
  const getFontSizeClass = () => {
    const len = sentence.length;
    if (len > 250) return "text-xl md:text-[1.5rem]"; // Hard (~60%)
    if (len > 100) return "text-2xl md:text-[2rem]";  // Medium (~80%)
    return "text-3xl md:text-[2.5rem]";              // Easy/Short (100%)
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="group bg-white p-10 md:p-16 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100 min-h-[400px] flex flex-col justify-center items-start relative cursor-text transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:border-slate-200"
      >
        {/* Decorative Header */}
        <div className="absolute top-8 left-10 flex items-center gap-3 select-none">
             <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
             <span className="text-xs font-bold text-slate-300 tracking-[0.2em] uppercase font-mono group-hover:text-slate-400 transition-colors">
                Typing Practice
             </span>
        </div>

        {/* Text Area */}
        <div className={`w-full font-serif-kr ${getFontSizeClass()} leading-[1.8] tracking-tight break-keep text-left`} style={{ wordSpacing: '0.1em' }}>
          {sentence.split('').map((targetChar, index) => {
            const isTyped = index < input.length;
            const inputChar = input[index];
            const isCurrent = index === input.length;
            
            // Logic:
            // 1. If Exact/Equivalent Match -> Correct (Black)
            // 2. If Mismatch:
            //    a) If it's the LAST character being typed AND is a partial match -> In Progress (Slate/Blue)
            //    b) Otherwise (wrong char, or partial match but user moved on) -> Error (Red)

            let displayChar = targetChar;
            let colorClass = "text-slate-200"; // Default: Untyped Gray
            
            if (isTyped) {
                const isCorrect = isEquivalentChar(inputChar, targetChar);
                const isLastChar = index === input.length - 1;

                if (isCorrect) {
                    colorClass = "text-slate-900";
                    displayChar = targetChar;
                } else {
                    if (inputChar === ' ' && targetChar !== ' ') {
                        // Space Error (Skipping)
                        colorClass = "text-slate-200";
                        displayChar = targetChar;
                    } else if (isLastChar && isHangulPartialMatch(inputChar, targetChar)) {
                        // Partial Match (Only allowed for the active character)
                        colorClass = "text-slate-600";
                        displayChar = inputChar;
                    } else {
                        // Real Error
                        colorClass = "text-red-500";
                        displayChar = inputChar;
                    }
                }
            }

            return (
                <span key={index} className={`relative inline-block rounded-sm px-[1px] -mx-[1px]`}>
                    {/* Cursor Bar */}
                    {isCurrent && (
                        <span className="absolute left-0 top-[10%] h-[80%] w-[2px] bg-slate-900 animate-pulse -ml-[1px] z-10"></span>
                    )}
                    
                    <span className={`${colorClass} transition-colors duration-75`}>
                        {displayChar === ' ' ? '\u00A0' : displayChar}
                    </span>
                </span>
            );
          })}
          
          {/* Cursor at the end of the sentence */}
          {input.length === sentence.length && (
               <span className="inline-block relative">
                   <span className="absolute left-0 top-[10%] h-[80%] w-[2px] bg-slate-900 animate-pulse -ml-[1px]"></span>
                   <span className="invisible font-serif-kr text-3xl md:text-[2.5rem]">&nbsp;</span>
               </span>
          )}
        </div>

        {/* Hidden Input */}
        <input
            ref={inputRef}
            type="text"
            className="absolute opacity-0 top-0 left-0 h-full w-full cursor-text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
        />
        
        {/* Footer Instructions */}
        <div className="absolute bottom-8 right-10 text-slate-300 text-sm font-medium select-none flex flex-col items-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
             <div className="flex items-center gap-2">
                <span className="font-mono text-xs">Skip</span>
                <kbd className="hidden sm:inline-block border border-slate-200 bg-slate-50 rounded px-2 py-1 text-xs font-bold text-slate-500 shadow-[0_2px_0_0_rgb(226,232,240)] translate-y-[-1px]">Ctrl+Enter</kbd>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs">Next</span>
                <kbd className="hidden sm:inline-block border border-slate-200 bg-slate-50 rounded px-2 py-1 text-xs font-bold text-slate-500 shadow-[0_2px_0_0_rgb(226,232,240)] translate-y-[-1px]">Enter</kbd>
            </div>
        </div>
      </div>
    </div>
  );
};