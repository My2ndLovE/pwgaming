import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export type Card = string; // e.g., 'Ah', 'Kd', '5c', '9s', '2h'

export interface ShuffleResult {
  deck: Card[];
  seed: string;
}

@Injectable()
export class DeckService {
  private readonly suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
  private readonly ranks = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'T',
    'J',
    'Q',
    'K',
    'A',
  ];

  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push(`${rank}${suit}`);
      }
    }
    return deck;
  }

  /**
   * Generate a cryptographically secure random seed
   */
  generateSeed(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Shuffle deck with optional seed (for replay)
   * @param deck - The deck to shuffle
   * @param seed - Optional seed for deterministic shuffle (replay)
   * @returns Shuffled deck and the seed used
   */
  shuffleWithSeed(deck: Card[], seed?: string): ShuffleResult {
    const usedSeed = seed || this.generateSeed();
    const shuffled = this.shuffleWithSeedInternal(deck, usedSeed);
    return { deck: shuffled, seed: usedSeed };
  }

  /**
   * Shuffle deck using Fisher-Yates with seeded RNG
   */
  private shuffleWithSeedInternal(deck: Card[], seed: string): Card[] {
    const shuffled = [...deck];
    const rng = this.createSeededRNG(seed);

    // Fisher-Yates shuffle with seeded randomness
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Create a seeded pseudo-random number generator
   * Uses a simple LCG (Linear Congruential Generator) seeded with hash
   */
  private createSeededRNG(seed: string): () => number {
    // Create hash from seed
    const hash = crypto.createHash('sha256').update(seed).digest();
    let state = hash.readUInt32BE(0);

    // LCG parameters (same as used in glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 31;

    return function () {
      state = (a * state + c) % m;
      return state / m;
    };
  }

  /**
   * Legacy shuffle method (kept for backward compatibility)
   * Uses cryptographic randomness
   */
  shuffle(deck: Card[]): Card[] {
    const shuffled = [...deck];
    // Fisher-Yates shuffle with cryptographic randomness
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.getSecureRandomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getSecureRandomInt(min: number, max: number): number {
    const range = max - min;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const threshold = maxValue - (maxValue % range);

    let value: number;
    do {
      const randomBytes = crypto.randomBytes(bytesNeeded);
      value = parseInt(randomBytes.toString('hex'), 16);
    } while (value >= threshold);

    return min + (value % range);
  }

  dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
    const dealt = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { dealt, remaining };
  }

  /**
   * Burns the top card from the deck (removes it without revealing)
   * Used in Texas Hold'em before dealing flop, turn, and river
   * @param deck - The deck to burn from
   * @returns The burned card and the remaining deck
   */
  burnCard(deck: Card[]): { burned: Card | undefined; remaining: Card[] } {
    if (deck.length === 0) {
      return { burned: undefined, remaining: [] };
    }

    const burned = deck[0];
    const remaining = deck.slice(1);
    return { burned, remaining };
  }
}
