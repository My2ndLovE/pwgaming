import { Injectable } from '@nestjs/common';
import { Hand } from 'pokersolver';

export interface HandResult {
  handType: number;
  handName: string;
  value: number;
  cards: string[];
}

@Injectable()
export class HandEvaluatorService {
  /**
   * Evaluate a poker hand using pokersolver library
   * @param cards - Array of 5-7 cards (format: 'Ah', 'Kd', etc.)
   * @returns Hand evaluation with type, name, and value
   */
  evaluateHand(cards: string[]): HandResult {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate a hand');
    }

    if (cards.length > 7) {
      throw new Error('Cannot evaluate more than 7 cards');
    }

    // pokersolver expects format like ['Ah', 'Kd', 'Qc', 'Js', 'Ts']
    const hand = Hand.solve(cards);

    return {
      handType: hand.rank,
      handName: hand.name,
      value: hand.value, // pokersolver: higher value = stronger hand
      cards: hand.cards.map(c => c.value + c.suit.toLowerCase()),
    };
  }

  /**
   * Compare two poker hands
   * @param hand1 - First hand (5-7 cards)
   * @param hand2 - Second hand (5-7 cards)
   * @returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   */
  compareHands(hand1: string[], hand2: string[]): number {
    const solvedHand1 = Hand.solve(hand1);
    const solvedHand2 = Hand.solve(hand2);

    // Use pokersolver's winners method to determine winner
    const winners = Hand.winners([solvedHand1, solvedHand2]);

    if (winners.length === 2) return 0; // Tie
    if (winners[0] === solvedHand1) return 1; // hand1 wins
    return -1; // hand2 wins
  }

  /**
   * Find all winners from multiple player hands
   * @param playerHands - Array of player hands with userId
   * @returns Array of winning user IDs (multiple if tie)
   */
  findWinners(playerHands: Array<{ userId: string; cards: string[] }>): string[] {
    if (playerHands.length === 0) return [];
    if (playerHands.length === 1) return [playerHands[0].userId];

    const hands = playerHands.map(ph => ({
      userId: ph.userId,
      hand: Hand.solve(ph.cards),
    }));

    // Use pokersolver's winners() method
    const solvedHands = hands.map(h => h.hand);
    const winners = Hand.winners(solvedHands);

    // Map back to userIds
    return hands
      .filter(h => winners.includes(h.hand))
      .map(h => h.userId);
  }
}
