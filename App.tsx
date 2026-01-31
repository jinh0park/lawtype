import React, { useState } from 'react';
import { GameState, Difficulty, TypingStats, SentenceResult } from './types';
import { fetchCivilLawSentences } from './services/lawService';
import { TypingArea } from './components/TypingArea';
import { StatsBoard } from './components/StatsBoard';
import { ResultScreen } from './components/ResultScreen';
import { Scale, Play, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentStats, setCurrentStats] = useState<TypingStats>({ cpm: 0, accuracy: 100, timeElapsed: 0, totalErrors: 0, progress: 0 });
  const [results, setResults] = useState<SentenceResult[]>([]);
  
  // Settings
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startGame = async () => {
    setGameState(GameState.LOADING);
    setErrorMsg(null);
    try {
      // Fetch 5 random sentences based on difficulty
      const fetchedSentences = await fetchCivilLawSentences(selectedDifficulty, 5);
      
      if (fetchedSentences.length === 0) {
        throw new Error("문장을 불러오지 못했습니다.");
      }
      setSentences(fetchedSentences);
      setCurrentSentenceIndex(0);
      setResults([]);
      setCurrentStats({ cpm: 0, accuracy: 100, timeElapsed: 0, totalErrors: 0, progress: 0 });
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setErrorMsg("법령 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setGameState(GameState.IDLE);
    }
  };

  const handleSentenceComplete = async (result: SentenceResult) => {
    // Check if skipped (0 score)
    if (result.cpm === 0 && result.accuracy === 0) {
        // Skip logic: Replace current sentence with a new one
        try {
            const newSentences = await fetchCivilLawSentences(selectedDifficulty, 1);
            if (newSentences.length > 0) {
                setSentences(prev => {
                    const next = [...prev];
                    next[currentSentenceIndex] = newSentences[0];
                    return next;
                });
                // Reset stats for the new sentence
                setCurrentStats({ cpm: 0, accuracy: 100, timeElapsed: 0, totalErrors: 0, progress: 0 });
            }
        } catch (e) {
            console.error("Failed to fetch replacement sentence", e);
        }
        return;
    }

    setResults(prev => [...prev, result]);
    
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setCurrentStats({ cpm: 0, accuracy: 100, timeElapsed: 0, totalErrors: 0, progress: 0 });
    } else {
      setGameState(GameState.FINISHED);
    }
  };

  const restartGame = () => {
    setGameState(GameState.IDLE);
    setSentences([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-slate-200 flex flex-col">
      {/* Header */}
      <header className="bg-transparent pt-6 pb-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={restartGame}>
            <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-serif-kr text-slate-900 group-hover:text-slate-700 transition-colors">LawType <span className="text-sm font-sans font-normal text-slate-400 ml-2">조문 타자 연습</span></h1>
          </div>
          {gameState === GameState.PLAYING && (
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                <div className="flex gap-1">
                    {sentences.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentSentenceIndex ? 'bg-slate-800 scale-125' : 
                            idx < currentSentenceIndex ? 'bg-slate-300' : 'bg-slate-100'
                        }`} />
                    ))}
                </div>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
        
        {/* IDLE State */}
        {gameState === GameState.IDLE && (
          <div className="w-full max-w-lg bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in">
            <h2 className="text-3xl font-bold mb-3 font-serif-kr text-slate-900">시작하기</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
                대한민국 민법 조문을 기반으로 한 타자 연습입니다.<br/>
                실제 법령 데이터를 무작위로 불러와 연습합니다.
            </p>
            
            <div className="space-y-8">
              
              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">난이도 (조문 길이)</label>
                 <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-2xl">
                    {Object.values(Difficulty).map((diff) => (
                        <button 
                            key={diff}
                            onClick={() => setSelectedDifficulty(diff)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                selectedDifficulty === diff
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                        >
                            <span>{diff.split(' ')[0]}</span>
                            <span className="text-xs font-normal opacity-70">{diff.split('(')[1].replace(')', '')}</span>
                        </button>
                    ))}
                 </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <button
                onClick={startGame}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                연습 시작
              </button>
            </div>
          </div>
        )}

        {/* LOADING State */}
        {gameState === GameState.LOADING && (
          <div className="text-center animate-pulse">
            <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-serif-kr">법령을 불러오는 중</h2>
            <p className="text-slate-400 font-medium">국가법령정보센터에서 민법 데이터를 가져오고 있습니다...</p>
          </div>
        )}

        {/* PLAYING State */}
        {gameState === GameState.PLAYING && sentences.length > 0 && (
          <div className="w-full max-w-6xl flex flex-col">
            <StatsBoard stats={currentStats} />
            <TypingArea 
                sentence={sentences[currentSentenceIndex]} 
                onComplete={handleSentenceComplete}
                onProgress={setCurrentStats}
            />
            <div className="mt-12 text-center">
               <p className="text-slate-300 text-xs font-medium tracking-wide">
                 SOURCE: 국가법령정보센터 (LAW.GO.KR)
               </p>
            </div>
          </div>
        )}

        {/* FINISHED State */}
        {gameState === GameState.FINISHED && (
          <ResultScreen results={results} onRestart={restartGame} />
        )}
      </main>
    </div>
  );
};

export default App;