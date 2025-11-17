import { Test, TestingModule } from '@nestjs/testing';
import { BlindService } from '../../../src/modules/game/services/blind.service';
import { GameState, PlayerState } from '../../../src/modules/game/services/game-state-machine.service';
import { SeatStatus } from '../../../src/modules/game/entities/player-seat.entity';
import { HandPhase } from '../../../src/modules/game/entities/game-hand.entity';

describe('BlindService', () => {
  let service: BlindService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlindService],
    }).compile();

    service = module.get<BlindService>(BlindService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postSmallBlind', () => {
    it('should deduct small blind from player chip stack', () => {
      const player: PlayerState = {
        userId: 'player1',
        position: 1,
        chipStack: 1000,
        currentBet: 0,
        hasActed: false,
        status: SeatStatus.ACTIVE,
      };

      const result = service.postSmallBlind(player, 50);

      expect(result.chipStack).toBe(950);
      expect(result.currentBet).toBe(50);
    });

    it('should handle all-in when chip stack less than small blind', () => {
      const player: PlayerState = {
        userId: 'player1',
        position: 1,
        chipStack: 30,
        currentBet: 0,
        hasActed: false,
        status: SeatStatus.ACTIVE,
      };

      const result = service.postSmallBlind(player, 50);

      expect(result.chipStack).toBe(0);
      expect(result.currentBet).toBe(30);
      expect(result.status).toBe(SeatStatus.ALL_IN);
    });
  });

  describe('postBigBlind', () => {
    it('should deduct big blind from player chip stack', () => {
      const player: PlayerState = {
        userId: 'player2',
        position: 2,
        chipStack: 1000,
        currentBet: 0,
        hasActed: false,
        status: SeatStatus.ACTIVE,
      };

      const result = service.postBigBlind(player, 100);

      expect(result.chipStack).toBe(900);
      expect(result.currentBet).toBe(100);
    });

    it('should handle all-in when chip stack less than big blind', () => {
      const player: PlayerState = {
        userId: 'player2',
        position: 2,
        chipStack: 60,
        currentBet: 0,
        hasActed: false,
        status: SeatStatus.ACTIVE,
      };

      const result = service.postBigBlind(player, 100);

      expect(result.chipStack).toBe(0);
      expect(result.currentBet).toBe(60);
      expect(result.status).toBe(SeatStatus.ALL_IN);
    });
  });

  describe('postBlinds', () => {
    it('should post both small and big blinds for standard game', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 3,
        currentBet: 0,
        minRaise: 0,
        activePlayers: [
          {
            userId: 'player0',
            position: 0,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player1',
            position: 1,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player2',
            position: 2,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player3',
            position: 3,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.postBlinds(state, 50, 100);

      // Small blind player
      const sbPlayer = result.activePlayers.find(p => p.position === 1);
      expect(sbPlayer.chipStack).toBe(950);
      expect(sbPlayer.currentBet).toBe(50);

      // Big blind player
      const bbPlayer = result.activePlayers.find(p => p.position === 2);
      expect(bbPlayer.chipStack).toBe(900);
      expect(bbPlayer.currentBet).toBe(100);

      // Current bet should be set to big blind
      expect(result.currentBet).toBe(100);
      expect(result.minRaise).toBe(100);
    });

    it('should handle heads-up special rules (dealer posts small blind)', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 0, // Dealer is SB in heads-up
        bigBlindPosition: 1,
        currentPosition: 0,
        currentBet: 0,
        minRaise: 0,
        activePlayers: [
          {
            userId: 'player0',
            position: 0,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player1',
            position: 1,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.postBlinds(state, 50, 100);

      // In heads-up, dealer (position 0) posts small blind
      const sbPlayer = result.activePlayers.find(p => p.position === 0);
      expect(sbPlayer.chipStack).toBe(950);
      expect(sbPlayer.currentBet).toBe(50);

      // Other player posts big blind
      const bbPlayer = result.activePlayers.find(p => p.position === 1);
      expect(bbPlayer.chipStack).toBe(900);
      expect(bbPlayer.currentBet).toBe(100);
    });

    it('should handle all-in blinds correctly', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 3,
        currentBet: 0,
        minRaise: 0,
        activePlayers: [
          {
            userId: 'player0',
            position: 0,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player1',
            position: 1,
            chipStack: 30, // Less than SB
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player2',
            position: 2,
            chipStack: 60, // Less than BB
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player3',
            position: 3,
            chipStack: 1000,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.postBlinds(state, 50, 100);

      // Small blind all-in
      const sbPlayer = result.activePlayers.find(p => p.position === 1);
      expect(sbPlayer.chipStack).toBe(0);
      expect(sbPlayer.currentBet).toBe(30);
      expect(sbPlayer.status).toBe(SeatStatus.ALL_IN);

      // Big blind all-in
      const bbPlayer = result.activePlayers.find(p => p.position === 2);
      expect(bbPlayer.chipStack).toBe(0);
      expect(bbPlayer.currentBet).toBe(60);
      expect(bbPlayer.status).toBe(SeatStatus.ALL_IN);
    });
  });

  describe('hasBigBlindOption', () => {
    it('should return true when BB has not raised and action returns to BB', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 2, // Action back to BB
        currentBet: 100,
        minRaise: 100,
        activePlayers: [
          {
            userId: 'player0',
            position: 0,
            chipStack: 900,
            currentBet: 100, // Called BB
            hasActed: true,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player1',
            position: 1,
            chipStack: 900,
            currentBet: 100, // Called BB
            hasActed: true,
            status: SeatStatus.ACTIVE,
          },
          {
            userId: 'player2',
            position: 2,
            chipStack: 900,
            currentBet: 100, // BB - hasn't acted yet
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.hasBigBlindOption(state);

      expect(result).toBe(true);
    });

    it('should return false when BB has already raised', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 2,
        currentBet: 200, // BB raised to 200
        minRaise: 100,
        activePlayers: [
          {
            userId: 'player2',
            position: 2,
            chipStack: 800,
            currentBet: 200,
            hasActed: true, // BB already acted
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.hasBigBlindOption(state);

      expect(result).toBe(false);
    });

    it('should return false when not in preflop phase', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.FLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 2,
        currentBet: 0,
        minRaise: 0,
        activePlayers: [
          {
            userId: 'player2',
            position: 2,
            chipStack: 900,
            currentBet: 0,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.hasBigBlindOption(state);

      expect(result).toBe(false);
    });

    it('should return false when there has been a raise beyond BB', () => {
      const state: GameState = {
        gameId: 'game1',
        phase: HandPhase.PREFLOP,
        dealerPosition: 0,
        smallBlindPosition: 1,
        bigBlindPosition: 2,
        currentPosition: 2,
        currentBet: 300, // Raised beyond BB
        minRaise: 100,
        activePlayers: [
          {
            userId: 'player2',
            position: 2,
            chipStack: 900,
            currentBet: 100,
            hasActed: false,
            status: SeatStatus.ACTIVE,
          },
        ],
      };

      const result = service.hasBigBlindOption(state);

      expect(result).toBe(false);
    });
  });

  describe('getBlindAmount', () => {
    it('should return correct small blind amount', () => {
      const amount = service.getBlindAmount('small', 50, 100);
      expect(amount).toBe(50);
    });

    it('should return correct big blind amount', () => {
      const amount = service.getBlindAmount('big', 50, 100);
      expect(amount).toBe(100);
    });

    it('should throw error for invalid blind type', () => {
      expect(() => {
        service.getBlindAmount('invalid' as any, 50, 100);
      }).toThrow();
    });
  });
});
