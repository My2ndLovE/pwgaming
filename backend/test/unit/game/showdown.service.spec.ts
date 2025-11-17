import { Test, TestingModule } from '@nestjs/testing';
import { ShowdownService } from '../../../src/modules/game/services/showdown.service';
import { HandEvaluatorService } from '../../../src/modules/game/services/hand-evaluator.service';
import { SeatStatus } from '../../../src/modules/game/entities/player-seat.entity';

describe('ShowdownService', () => {
  let service: ShowdownService;
  let handEvaluator: HandEvaluatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShowdownService, HandEvaluatorService],
    }).compile();

    service = module.get<ShowdownService>(ShowdownService);
    handEvaluator = module.get<HandEvaluatorService>(HandEvaluatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('determineShowdownOrder', () => {
    it('should place last aggressor first', () => {
      const players = [
        { userId: 'p1', position: 0, wasLastAggressor: false },
        { userId: 'p2', position: 1, wasLastAggressor: true },
        { userId: 'p3', position: 2, wasLastAggressor: false },
      ];

      const order = service.determineShowdownOrder(players, 0);

      expect(order[0].userId).toBe('p2'); // Last aggressor first
    });

    it('should order remaining players clockwise from button', () => {
      const players = [
        { userId: 'p1', position: 0, wasLastAggressor: false },
        { userId: 'p2', position: 1, wasLastAggressor: false },
        { userId: 'p3', position: 2, wasLastAggressor: false },
      ];

      const order = service.determineShowdownOrder(players, 0); // Dealer at position 0

      // Clockwise from dealer: 1, 2, 0
      expect(order[0].position).toBe(1);
      expect(order[1].position).toBe(2);
      expect(order[2].position).toBe(0);
    });

    it('should handle no aggressor (everyone checked)', () => {
      const players = [
        { userId: 'p1', position: 0, wasLastAggressor: false },
        { userId: 'p2', position: 1, wasLastAggressor: false },
      ];

      const order = service.determineShowdownOrder(players, 0);

      // Start from dealer's left
      expect(order[0].position).toBe(1);
      expect(order[1].position).toBe(0);
    });
  });

  describe('allowsMucking', () => {
    it('should allow mucking for losing hands', () => {
      const player = {
        userId: 'p1',
        cards: ['2h', '3d'],
        isWinner: false,
        status: SeatStatus.ACTIVE,
      };

      const canMuck = service.allowsMucking(player);

      expect(canMuck).toBe(true);
    });

    it('should not allow mucking for winners', () => {
      const player = {
        userId: 'p1',
        cards: ['Ah', 'Ad'],
        isWinner: true,
        status: SeatStatus.ACTIVE,
      };

      const canMuck = service.allowsMucking(player);

      expect(canMuck).toBe(false);
    });

    it('should not allow mucking for all-in players', () => {
      const player = {
        userId: 'p1',
        cards: ['2h', '3d'],
        isWinner: false,
        status: SeatStatus.ALL_IN,
      };

      const canMuck = service.allowsMucking(player);

      expect(canMuck).toBe(false); // All-in players must show
    });
  });

  describe('requiresCardReveal', () => {
    it('should require reveal for all-in players', () => {
      const player = {
        userId: 'p1',
        status: SeatStatus.ALL_IN,
      };

      const required = service.requiresCardReveal(player);

      expect(required).toBe(true);
    });

    it('should require reveal for winners', () => {
      const player = {
        userId: 'p1',
        status: SeatStatus.ACTIVE,
        isWinner: true,
      };

      const required = service.requiresCardReveal(player);

      expect(required).toBe(true);
    });

    it('should not require reveal for losing folded players', () => {
      const player = {
        userId: 'p1',
        status: SeatStatus.FOLDED,
        isWinner: false,
      };

      const required = service.requiresCardReveal(player);

      expect(required).toBe(false);
    });
  });

  describe('processShowdown', () => {
    it('should determine winners and reveal order', () => {
      const players = [
        {
          userId: 'p1',
          position: 0,
          cards: ['Ah', 'Ad'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: true,
        },
        {
          userId: 'p2',
          position: 1,
          cards: ['Kh', 'Kd'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: false,
        },
        {
          userId: 'p3',
          position: 2,
          cards: ['Qh', 'Qd'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: false,
        },
      ];
      const communityCards = ['2s', '5c', '7h', '9d', 'Jc'];

      const result = service.processShowdown(players, communityCards, 0);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].userId).toBe('p1'); // Pair of aces wins
      expect(result.revealOrder[0].userId).toBe('p1'); // Last aggressor shows first
    });

    it('should handle split pots', () => {
      const players = [
        {
          userId: 'p1',
          position: 0,
          cards: ['Ah', 'Kh'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: false,
        },
        {
          userId: 'p2',
          position: 1,
          cards: ['Ad', 'Kd'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: false,
        },
      ];
      const communityCards = ['Qh', 'Qd', 'Qs', '2s', '3c'];

      const result = service.processShowdown(players, communityCards, 0);

      expect(result.winners).toHaveLength(2); // Both have same hand
    });

    it('should handle single remaining player (no showdown needed)', () => {
      const players = [
        {
          userId: 'p1',
          position: 0,
          cards: ['Ah', 'Ad'],
          status: SeatStatus.ACTIVE,
          wasLastAggressor: false,
        },
      ];
      const communityCards = ['2s', '5c', '7h', '9d', 'Jc'];

      const result = service.processShowdown(players, communityCards, 0);

      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].userId).toBe('p1');
      expect(result.revealOrder).toHaveLength(1);
    });
  });
});
