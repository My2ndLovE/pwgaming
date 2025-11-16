import { Injectable } from '@nestjs/common';
import { evaluateCards, rankCards, rankDescription, type HandRank } from 'phe';

export interface HandResult {
  handType: HandRank;
  handName: string;
  value: number;
  cards: string[];
}

@Injectable()
export class HandEvaluatorService {
  /**
   * Evaluate a poker hand using PHE library
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

    // PHE expects format like ['Ah', 'Kd', 'Qc', 'Js', 'Ts']
    // evaluateCards returns hand strength (lower is better)
    const value = evaluateCards(cards);
    const handType = rankCards(cards);
    const handName = rankDescription[handType];

    return {
      handType,
      handName,
      value,
      cards: cards.slice(0, 5), // Return best 5 cards
    };
  }

  /**
   * Compare two poker hands
   * @param hand1 - First hand (5-7 cards)
   * @param hand2 - Second hand (5-7 cards)
   * @returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   */
  compareHands(hand1: string[], hand2: string[]): number {
    const eval1 = this.evaluateHand(hand1);
    const eval2 = this.evaluateHand(hand2);

    // PHE: Lower value wins (opposite of poker-evaluator)
    if (eval1.value < eval2.value) return 1;
    if (eval1.value > eval2.value) return -1;
    return 0;
  }

  /**
   * Find all winners from multiple player hands
   * @param playerHands - Array of player hands with userId
   * @returns Array of winning user IDs (multiple if tie)
   */
  findWinners(playerHands: Array<{ userId: string; cards: string[] }>): string[] {
    if (playerHands.length === 0) return [];
    if (playerHands.length === 1) return [playerHands[0].userId];

    const evaluations = playerHands.map((ph) => ({
      userId: ph.userId,
      evaluation: this.evaluateHand(ph.cards),
    }));

    // PHE: Lower value wins
    const minValue = Math.min(...evaluations.map((e) => e.evaluation.value));
    return evaluations.filter((e) => e.evaluation.value === minValue).map((e) => e.userId);
  }
}
