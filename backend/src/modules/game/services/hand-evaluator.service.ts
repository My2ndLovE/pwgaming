import { Injectable } from '@nestjs/common';
// Using poker-evaluator library
const PokerEvaluator = require('poker-evaluator');

export interface HandResult {
  handType: string;
  handName: string;
  value: number;
  cards: string[];
}

@Injectable()
export class HandEvaluatorService {
  evaluateHand(cards: string[]): HandResult {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate a hand');
    }

    // poker-evaluator expects format like ['Ah', 'Kd', 'Qc', 'Js', 'Tc']
    const result = PokerEvaluator.evalHand(cards);

    return {
      handType: result.handType,
      handName: result.handName,
      value: result.value,
      cards: result.cards || cards.slice(0, 5),
    };
  }

  compareHands(hand1: string[], hand2: string[]): number {
    const eval1 = this.evaluateHand(hand1);
    const eval2 = this.evaluateHand(hand2);

    // Higher value wins
    if (eval1.value > eval2.value) return 1;
    if (eval1.value < eval2.value) return -1;
    return 0;
  }

  findWinners(playerHands: Array<{ userId: string; cards: string[] }>): string[] {
    if (playerHands.length === 0) return [];
    if (playerHands.length === 1) return [playerHands[0].userId];

    const evaluations = playerHands.map((ph) => ({
      userId: ph.userId,
      evaluation: this.evaluateHand(ph.cards),
    }));

    const maxValue = Math.max(...evaluations.map((e) => e.evaluation.value));
    return evaluations.filter((e) => e.evaluation.value === maxValue).map((e) => e.userId);
  }
}
