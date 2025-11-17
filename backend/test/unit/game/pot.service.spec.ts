import { PotService } from '../../../src/modules/game/services/pot.service';

describe('PotService', () => {
  let service: PotService;

  beforeEach(() => {
    service = new PotService();
  });

  describe('calculatePots', () => {
    it('should return empty array for no contributions', () => {
      const pots = service.calculatePots([]);
      expect(pots).toEqual([]);
    });

    it('should create single pot when all players contribute equally', () => {
      const contributions = [
        { userId: 'player1', amount: 100 },
        { userId: 'player2', amount: 100 },
        { userId: 'player3', amount: 100 },
      ];
      
      const pots = service.calculatePots(contributions);
      
      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toHaveLength(3);
    });

    it('should create main pot and side pot for one all-in', () => {
      const contributions = [
        { userId: 'player1', amount: 50 },
        { userId: 'player2', amount: 100 },
        { userId: 'player3', amount: 100 },
      ];
      
      const pots = service.calculatePots(contributions);
      
      expect(pots).toHaveLength(2);
      expect(pots[0].amount).toBe(150);
      expect(pots[1].amount).toBe(100);
    });

    it('should create multiple side pots for multiple all-ins', () => {
      const contributions = [
        { userId: 'player1', amount: 30 },
        { userId: 'player2', amount: 70 },
        { userId: 'player3', amount: 100 },
        { userId: 'player4', amount: 100 },
      ];
      
      const pots = service.calculatePots(contributions);
      
      expect(pots).toHaveLength(3);
      expect(pots[0].amount).toBe(120);
      expect(pots[1].amount).toBe(120);
      expect(pots[2].amount).toBe(60);
    });
  });

  describe('distributePots', () => {
    it('should distribute single pot to single winner', () => {
      const pots = [{ amount: 300, eligiblePlayers: ['player1', 'player2'] }];
      const winners = [{ userId: 'player1', potIndex: 0 }];

      const winnings = service.distributePots(pots, winners);

      expect(winnings.get('player1')).toBe(300);
    });

    it('should split pot between multiple winners', () => {
      const pots = [{ amount: 300, eligiblePlayers: ['player1', 'player2'] }];
      const winners = [
        { userId: 'player1', potIndex: 0 },
        { userId: 'player2', potIndex: 0 },
      ];

      const winnings = service.distributePots(pots, winners);

      expect(winnings.get('player1')).toBe(150);
      expect(winnings.get('player2')).toBe(150);
    });
  });

  describe('distributeOddChip', () => {
    it('should give odd chip to player closest to button clockwise', () => {
      const potAmount = 101; // Odd amount
      const winners = [
        { userId: 'p1', position: 2 },
        { userId: 'p2', position: 4 },
      ];
      const dealerPosition = 0;

      const distribution = service.distributeOddChip(potAmount, winners, dealerPosition);

      // Each gets 50, odd chip (1) goes to first winner clockwise from button
      expect(distribution.get('p1')).toBe(51); // Closer to button (position 2)
      expect(distribution.get('p2')).toBe(50);
    });

    it('should handle exact split (no odd chip)', () => {
      const potAmount = 100;
      const winners = [
        { userId: 'p1', position: 0 },
        { userId: 'p2', position: 1 },
      ];

      const distribution = service.distributeOddChip(potAmount, winners, 0);

      expect(distribution.get('p1')).toBe(50);
      expect(distribution.get('p2')).toBe(50);
    });

    it('should handle 3-way split with 2 odd chips', () => {
      const potAmount = 100; // 33.33... each, 2 chips remain
      const winners = [
        { userId: 'p1', position: 1 },
        { userId: 'p2', position: 3 },
        { userId: 'p3', position: 5 },
      ];
      const dealerPosition = 0;

      const distribution = service.distributeOddChip(potAmount, winners, dealerPosition);

      // Base: 33 each, 1 extra to first two clockwise from button
      expect(distribution.get('p1')).toBe(34); // First clockwise
      expect(distribution.get('p2')).toBe(33);
      expect(distribution.get('p3')).toBe(33);
    });
  });

  describe('Complex Side Pot Scenarios', () => {
    it('should handle 4+ player all-ins with different amounts', () => {
      const contributions = [
        { userId: 'p1', amount: 10 },
        { userId: 'p2', amount: 25 },
        { userId: 'p3', amount: 50 },
        { userId: 'p4', amount: 75 },
        { userId: 'p5', amount: 100 },
      ];

      const pots = service.calculatePots(contributions);

      // Pot 1: 10 * 5 players = 50 (everyone eligible)
      // Pot 2: (25-10) * 4 players = 60 (p2-p5 eligible)
      // Pot 3: (50-25) * 3 players = 75 (p3-p5 eligible)
      // Pot 4: (75-50) * 2 players = 50 (p4-p5 eligible)
      // Pot 5: (100-75) * 1 player = 25 (p5 only)

      expect(pots).toHaveLength(5);
      expect(pots[0].amount).toBe(50);
      expect(pots[0].eligiblePlayers).toHaveLength(5);
      expect(pots[1].amount).toBe(60);
      expect(pots[1].eligiblePlayers).toHaveLength(4);
      expect(pots[2].amount).toBe(75);
      expect(pots[3].amount).toBe(50);
      expect(pots[4].amount).toBe(25);
      expect(pots[4].eligiblePlayers).toEqual(['p5']);
    });

    it('should handle tied hands with side pots', () => {
      const pots = [
        { amount: 100, eligiblePlayers: ['p1', 'p2', 'p3'] },
        { amount: 50, eligiblePlayers: ['p2', 'p3'] },
      ];
      const winners = [
        { userId: 'p2', potIndex: 0 },
        { userId: 'p3', potIndex: 0 },
        { userId: 'p2', potIndex: 1 },
        { userId: 'p3', potIndex: 1 },
      ];

      const winnings = service.distributePots(pots, winners);

      expect(winnings.get('p2')).toBe(75); // 50 from pot0 + 25 from pot1
      expect(winnings.get('p3')).toBe(75);
    });
  });
});