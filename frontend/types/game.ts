export enum ActionType {
  FOLD = 'fold',
  CHECK = 'check',
  CALL = 'call',
  BET = 'bet',
  RAISE = 'raise',
  ALL_IN = 'all_in',
}

export enum HandPhase {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
  SHOWDOWN = 'showdown',
}

export enum SeatStatus {
  ACTIVE = 'active',
  FOLDED = 'folded',
  ALL_IN = 'all_in',
  DISCONNECTED = 'disconnected',
  SITTING_OUT = 'sitting_out',
}

// Type guard to ensure backend values match
export type SeatStatusValue = 'active' | 'folded' | 'all_in' | 'disconnected' | 'sitting_out';

export interface Player {
  userId: string;
  position: number;
  chipStack: number;
  currentBet: number;
  status: SeatStatus | SeatStatusValue;
  hasActed: boolean;
  cards: string[];
}

export interface GameState {
  phase: HandPhase;
  dealerPosition: number;
  currentPosition: number;
  currentBet: number;
  minRaise: number;
  communityCards: string[];
  players: Player[];
}

export interface WinnerInfo {
  userId: string;
  handName: string;
  handCards: string[];
}

export interface Pot {
  amount: number;
  eligiblePlayers: string[];
}
