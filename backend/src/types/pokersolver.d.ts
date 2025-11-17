declare module 'pokersolver' {
  export interface HandResult {
    name: string;
    descr: string;
    rank: number;
    value: number;
    cards: Card[];
  }

  export interface Card {
    value: string;
    suit: string;
    rank: number;
    wildValue?: string;
  }

  export class Hand {
    name: string;
    descr: string;
    rank: number;
    value: number;
    cards: Card[];

    static solve(cards: string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: Hand[]): Hand[];
    static winnerNames(hands: Hand[]): string[];
  }

  export class Game {
    name: string;
    handValues: string[];
    constructor(name: string);
  }
}
