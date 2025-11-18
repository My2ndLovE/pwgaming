import { HandEvaluatorService } from '../../../src/modules/game/services/hand-evaluator.service';

describe('HandEvaluatorService', () => {
  let service: HandEvaluatorService;

  beforeEach(() => {
    service = new HandEvaluatorService();
  });

  describe('evaluateHand', () => {
    it('should evaluate royal flush correctly', () => {
      const cards = ['Ah', 'Kh', 'Qh', 'Jh', 'Th'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(9); // pokersolver: rank 9 = STRAIGHT_FLUSH
      expect(result.handName).toBe('Straight Flush');
    });

    it('should evaluate four of a kind correctly', () => {
      const cards = ['As', 'Ah', 'Ad', 'Ac', 'Kh'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(8); // pokersolver: rank 8 = FOUR_OF_A_KIND
      expect(result.handName).toBe('Four of a Kind');
    });

    it('should evaluate full house correctly', () => {
      const cards = ['As', 'Ah', 'Ad', 'Kc', 'Kh'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(7); // pokersolver: rank 7 = FULL_HOUSE
      expect(result.handName).toBe('Full House');
    });

    it('should evaluate flush correctly', () => {
      const cards = ['Ah', 'Kh', '9h', '7h', '4h'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(6); // pokersolver: rank 6 = FLUSH
      expect(result.handName).toBe('Flush');
    });

    it('should evaluate straight correctly', () => {
      const cards = ['9h', '8d', '7c', '6s', '5h'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(5); // pokersolver: rank 5 = STRAIGHT
      expect(result.handName).toBe('Straight');
    });

    it('should evaluate three of a kind correctly', () => {
      const cards = ['As', 'Ah', 'Ad', 'Kc', 'Qh'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(4); // pokersolver: rank 4 = THREE_OF_A_KIND
      expect(result.handName).toBe('Three of a Kind');
    });

    it('should evaluate two pair correctly', () => {
      const cards = ['As', 'Ah', 'Kd', 'Kc', 'Qh'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(3); // pokersolver: rank 3 = TWO_PAIR
      expect(result.handName).toBe('Two Pair');
    });

    it('should evaluate one pair correctly', () => {
      const cards = ['As', 'Ah', 'Kd', 'Qc', 'Jh'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(2); // pokersolver: rank 2 = ONE_PAIR
      expect(result.handName).toBe('Pair');
    });

    it('should evaluate high card correctly', () => {
      const cards = ['As', 'Kh', 'Qd', 'Jc', '9h'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(1); // pokersolver: rank 1 = HIGH_CARD
      expect(result.handName).toBe('High Card');
    });

    it('should throw error for less than 5 cards', () => {
      const cards = ['As', 'Kh', 'Qd'];

      expect(() => service.evaluateHand(cards)).toThrow(
        'Need at least 5 cards',
      );
    });

    it('should throw error for more than 7 cards', () => {
      const cards = ['As', 'Kh', 'Qd', 'Jc', 'Th', '9s', '8d', '7h'];

      expect(() => service.evaluateHand(cards)).toThrow(
        'Cannot evaluate more than 7 cards',
      );
    });

    it('should handle 7-card hand (best 5 cards)', () => {
      const cards = ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2c', '3d'];
      const result = service.evaluateHand(cards);

      expect(result.handType).toBe(9); // pokersolver: rank 9 = STRAIGHT_FLUSH
      expect(result.cards).toHaveLength(5);
    });
  });

  describe('compareHands', () => {
    it('should return 1 when hand1 wins', () => {
      const hand1 = ['As', 'Ah', 'Ad', 'Ac', 'Kh']; // Four of a kind
      const hand2 = ['Ks', 'Kh', 'Kd', 'Qc', 'Qh']; // Full house

      const result = service.compareHands(hand1, hand2);
      expect(result).toBe(1);
    });

    it('should return -1 when hand2 wins', () => {
      const hand1 = ['As', 'Ah', 'Kd', 'Kc', 'Qh']; // Two pair
      const hand2 = ['9h', '8d', '7c', '6s', '5h']; // Straight

      const result = service.compareHands(hand1, hand2);
      expect(result).toBe(-1);
    });

    it('should return 0 for tie', () => {
      const hand1 = ['As', 'Kh', 'Qd', 'Jc', 'Th'];
      const hand2 = ['As', 'Kh', 'Qd', 'Jc', 'Th'];

      const result = service.compareHands(hand1, hand2);
      expect(result).toBe(0);
    });
  });

  describe('findWinners', () => {
    it('should return empty array for no hands', () => {
      const result = service.findWinners([]);
      expect(result).toEqual([]);
    });

    it('should return single player for one hand', () => {
      const hands = [
        { userId: 'player1', cards: ['As', 'Kh', 'Qd', 'Jc', 'Th'] },
      ];
      const result = service.findWinners(hands);

      expect(result).toEqual(['player1']);
    });

    it('should return single winner from multiple hands', () => {
      const hands = [
        { userId: 'player1', cards: ['As', 'Ah', 'Ad', 'Ac', 'Kh'] }, // Four of a kind
        { userId: 'player2', cards: ['Ks', 'Kh', 'Kd', 'Qc', 'Qh'] }, // Full house
        { userId: 'player3', cards: ['9h', '8d', '7c', '6s', '5h'] }, // Straight
      ];

      const result = service.findWinners(hands);
      expect(result).toEqual(['player1']);
    });

    it('should return multiple winners for tied hands', () => {
      const hands = [
        { userId: 'player1', cards: ['As', 'Kh', 'Qd', 'Jc', 'Th'] },
        { userId: 'player2', cards: ['As', 'Kh', 'Qd', 'Jc', 'Th'] },
        { userId: 'player3', cards: ['9h', '8d', '7c', '6s', '5h'] },
      ];

      const result = service.findWinners(hands);
      expect(result).toContain('player1');
      expect(result).toContain('player2');
      expect(result).not.toContain('player3');
      expect(result).toHaveLength(2);
    });
  });
});
