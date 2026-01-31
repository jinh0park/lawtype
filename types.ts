export enum GameState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export enum Difficulty {
  EASY = '초급 (단문 조항)',
  MEDIUM = '중급 (일반 조항)',
  HARD = '고급 (장문 조항)'
}

export enum LawTopic {
  CIVIL = '민법',
  CRIMINAL = '형법',
  CONSTITUTION = '헌법',
  COMMERCIAL = '상법',
  ADMINISTRATIVE = '행정법'
}

export interface TypingStats {
  cpm: number; // Characters Per Minute (타수)
  accuracy: number;
  timeElapsed: number;
  totalErrors: number;
  progress: number;
}

export interface SentenceResult {
  original: string;
  typed: string;
  cpm: number;
  accuracy: number;
}