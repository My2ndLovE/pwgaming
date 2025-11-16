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
});