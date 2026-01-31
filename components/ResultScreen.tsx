import React from 'react';
import { SentenceResult } from '../types';

interface ResultScreenProps {
  results: SentenceResult[];
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ results, onRestart }) => {
  const avgCpm = Math.round(results.reduce((acc, curr) => acc + curr.cpm, 0) / results.length) || 0;
  const avgAcc = Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / results.length) || 0;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center animate-fade-in-up">
      <h2 className="text-3xl font-bold font-serif-kr text-slate-900 mb-10">연습 완료</h2>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="text-blue-600 text-sm font-bold uppercase mb-2">평균 타수</div>
          <div className="text-4xl font-mono font-bold text-blue-900">{avgCpm} <span className="text-lg text-blue-400 font-normal">타/분</span></div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-6">
          <div className="text-emerald-600 text-sm font-bold uppercase mb-2">평균 정확도</div>
          <div className="text-4xl font-mono font-bold text-emerald-900">{avgAcc}<span className="text-lg text-emerald-400 font-normal">%</span></div>
        </div>
      </div>

      <div className="space-y-4 mb-8 text-left">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">상세 기록</h3>
        {results.map((res, idx) => (
          <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
             <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">문장 {idx + 1}</span>
                <div className="text-xs font-mono space-x-2">
                    <span className="text-slate-600">{res.cpm} 타</span>
                    <span className={`${res.accuracy < 100 ? 'text-red-500' : 'text-emerald-500'}`}>{res.accuracy}%</span>
                </div>
             </div>
             <p className="text-slate-700 text-sm truncate font-serif-kr opacity-80">{res.original}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl w-full md:w-auto"
      >
        다시하기
      </button>
    </div>
  );
};