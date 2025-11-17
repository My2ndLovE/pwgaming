import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export type Card = string; // e.g., 'Ah', 'Kd', '5c', '9s', '2h'

@Injectable()
export class DeckService {
  private readonly suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
  private readonly ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push(`${rank}${suit}`);
      }
    }
    return deck;
  }

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
