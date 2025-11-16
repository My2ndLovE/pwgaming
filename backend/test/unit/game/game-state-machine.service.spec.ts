import { GameStateMachine } from '../../../src/modules/game/services/game-state-machine.service';
import { HandPhase } from '../../../src/modules/game/entities/game-hand.entity';
import { SeatStatus } from '../../../src/modules/game/entities/player-seat.entity';

describe('GameStateMachine', () => {
  let service: GameStateMachine;

  beforeEach(() => {
    service = new GameStateMachine();
  });

  describe('initializeHand', () => {
    it('should initialize hand in PREFLOP phase', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];

      const state = service.initializeHand(players, 0, 50, 100);

      expect(state.phase).toBe(HandPhase.PREFLOP);
      expect(state.dealerPosition).toBe(0);
      expect(state.smallBlindPosition).toBe(1);
      expect(state.bigBlindPosition).toBe(2);
      expect(state.currentBet).toBe(100);
      expect(state.currentPosition).toBe(0); // UTG (first to act after BB)
      expect(state.activePlayers).toHaveLength(3);
    });

    it('should handle heads-up blind positions correctly', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
      ];

      const state = service.initializeHand(players, 0, 50, 100);

      // In heads-up: dealer posts SB, other player posts BB
      expect(state.dealerPosition).toBe(0);
      expect(state.smallBlindPosition).toBe(0);
      expect(state.bigBlindPosition).toBe(1);
      expect(state.currentPosition).toBe(0); // Dealer acts first preflop
    });

    it('should rotate dealer position correctly', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];

      const state = service.initializeHand(players, 2, 50, 100);

      expect(state.dealerPosition).toBe(2);
      expect(state.smallBlindPosition).toBe(0);
      expect(state.bigBlindPosition).toBe(1);
    });
  });

  describe('advancePhase', () => {
    const mockState = {
      phase: HandPhase.PREFLOP,
      dealerPosition: 0,
      smallBlindPosition: 1,
      bigBlindPosition: 2,
      currentBet: 100,
      minRaise: 100,
      currentPosition: 0,
      activePlayers: [
        { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
        { userId: 'p2', position: 1, status: SeatStatus.ACTIVE },
        { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
      ],
    };

    it('should advance from PREFLOP to FLOP', () => {
      const newState = service.advancePhase(mockState);

      expect(newState.phase).toBe(HandPhase.FLOP);
      expect(newState.currentBet).toBe(0);
      expect(newState.minRaise).toBe(100);
      expect(newState.currentPosition).toBe(1); // SB acts first post-flop
    });

    it('should advance from FLOP to TURN', () => {
      const state = { ...mockState, phase: HandPhase.FLOP };
      const newState = service.advancePhase(state);

      expect(newState.phase).toBe(HandPhase.TURN);
      expect(newState.currentBet).toBe(0);
    });

    it('should advance from TURN to RIVER', () => {
      const state = { ...mockState, phase: HandPhase.TURN };
      const newState = service.advancePhase(state);

      expect(newState.phase).toBe(HandPhase.RIVER);
      expect(newState.currentBet).toBe(0);
    });

    it('should advance from RIVER to SHOWDOWN', () => {
      const state = { ...mockState, phase: HandPhase.RIVER };
      const newState = service.advancePhase(state);

      expect(newState.phase).toBe(HandPhase.SHOWDOWN);
    });

    it('should skip folded players when determining first actor', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
          { userId: 'p2', position: 1, status: SeatStatus.FOLDED },
          { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
        ],
      };

      const newState = service.advancePhase(state);

      expect(newState.currentPosition).toBe(2); // Skip SB (folded), go to BB
    });

    it('should handle all-in players correctly (skip them for action)', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
          { userId: 'p2', position: 1, status: SeatStatus.ALL_IN },
          { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
        ],
      };

      const newState = service.advancePhase(state);

      expect(newState.currentPosition).toBe(2); // Skip SB (all-in)
    });
  });

  describe('getNextPosition', () => {
    const activePlayers = [
      { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
      { userId: 'p2', position: 1, status: SeatStatus.FOLDED },
      { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
      { userId: 'p4', position: 3, status: SeatStatus.ALL_IN },
      { userId: 'p5', position: 4, status: SeatStatus.ACTIVE },
    ];

    it('should get next active player', () => {
      const next = service.getNextPosition(0, activePlayers);
      expect(next).toBe(2); // Skip position 1 (folded)
    });

    it('should skip all-in players', () => {
      const next = service.getNextPosition(2, activePlayers);
      expect(next).toBe(4); // Skip position 3 (all-in)
    });

    it('should wrap around to beginning', () => {
      const next = service.getNextPosition(4, activePlayers);
      expect(next).toBe(0); // Wrap to position 0
    });

    it('should return -1 when no active players remain', () => {
      const allFolded = activePlayers.map(p => ({
        ...p,
        status: SeatStatus.FOLDED,
      }));

      const next = service.getNextPosition(0, allFolded);
      expect(next).toBe(-1);
    });
  });

  describe('isBettingRoundComplete', () => {
    const mockState = {
      currentBet: 100,
      activePlayers: [
        { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        { userId: 'p2', position: 1, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        { userId: 'p3', position: 2, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
      ],
    };

    it('should return true when all active players have matched the bet and acted', () => {
      const isComplete = service.isBettingRoundComplete(mockState);
      expect(isComplete).toBe(true);
    });

    it('should return false when a player has not acted', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p2', position: 1, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: false },
          { userId: 'p3', position: 2, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        ],
      };

      const isComplete = service.isBettingRoundComplete(state);
      expect(isComplete).toBe(false);
    });

    it('should return false when a player has not matched the bet', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p2', position: 1, currentBet: 50, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p3', position: 2, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        ],
      };

      const isComplete = service.isBettingRoundComplete(state);
      expect(isComplete).toBe(false);
    });

    it('should ignore folded players', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p2', position: 1, currentBet: 0, status: SeatStatus.FOLDED, hasActed: true },
          { userId: 'p3', position: 2, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        ],
      };

      const isComplete = service.isBettingRoundComplete(state);
      expect(isComplete).toBe(true);
    });

    it('should ignore all-in players', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p2', position: 1, currentBet: 50, status: SeatStatus.ALL_IN, hasActed: true },
          { userId: 'p3', position: 2, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        ],
      };

      const isComplete = service.isBettingRoundComplete(state);
      expect(isComplete).toBe(true);
    });

    it('should return true when only one player remains (others folded)', () => {
      const state = {
        ...mockState,
        activePlayers: [
          { userId: 'p1', position: 0, currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { userId: 'p2', position: 1, currentBet: 0, status: SeatStatus.FOLDED, hasActed: true },
          { userId: 'p3', position: 2, currentBet: 0, status: SeatStatus.FOLDED, hasActed: true },
        ],
      };

      const isComplete = service.isBettingRoundComplete(state);
      expect(isComplete).toBe(true);
    });
  });

  describe('isHandComplete', () => {
    const activePlayers = [
      { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
      { userId: 'p2', position: 1, status: SeatStatus.FOLDED },
      { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
    ];

    it('should return true when only one active player remains', () => {
      const players = [
        { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
        { userId: 'p2', position: 1, status: SeatStatus.FOLDED },
        { userId: 'p3', position: 2, status: SeatStatus.FOLDED },
      ];

      const isComplete = service.isHandComplete(players, HandPhase.FLOP);
      expect(isComplete).toBe(true);
    });

    it('should return true when phase is SHOWDOWN', () => {
      const isComplete = service.isHandComplete(activePlayers, HandPhase.SHOWDOWN);
      expect(isComplete).toBe(true);
    });

    it('should return false when multiple players active and not at showdown', () => {
      const isComplete = service.isHandComplete(activePlayers, HandPhase.FLOP);
      expect(isComplete).toBe(false);
    });
  });

  describe('calculateNextDealer', () => {
    const players = [
      { userId: 'p1', position: 0 },
      { userId: 'p2', position: 1 },
      { userId: 'p3', position: 2 },
      { userId: 'p4', position: 3 },
    ];

    it('should rotate dealer to next position', () => {
      const nextDealer = service.calculateNextDealer(0, players);
      expect(nextDealer).toBe(1);
    });

    it('should wrap around to first position', () => {
      const nextDealer = service.calculateNextDealer(3, players);
      expect(nextDealer).toBe(0);
    });

    it('should handle 2 players', () => {
      const twoPlayers = [
        { userId: 'p1', position: 0 },
        { userId: 'p2', position: 1 },
      ];

      const nextDealer = service.calculateNextDealer(0, twoPlayers);
      expect(nextDealer).toBe(1);
    });
  });

  describe('getFirstActorPreflop', () => {
    it('should return UTG (left of BB) for 3+ players', () => {
      const firstActor = service.getFirstActorPreflop(2, 3);
      expect(firstActor).toBe(0); // BB at 2, UTG at 0
    });

    it('should return dealer for heads-up', () => {
      const firstActor = service.getFirstActorPreflop(1, 2);
      expect(firstActor).toBe(0); // Dealer acts first preflop in heads-up
    });
  });

  describe('getFirstActorPostflop', () => {
    const activePlayers = [
      { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
      { userId: 'p2', position: 1, status: SeatStatus.ACTIVE },
      { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
    ];

    it('should return first active player after dealer', () => {
      const firstActor = service.getFirstActorPostflop(0, activePlayers);
      expect(firstActor).toBe(1);
    });

    it('should skip folded players', () => {
      const players = [
        { userId: 'p1', position: 0, status: SeatStatus.ACTIVE },
        { userId: 'p2', position: 1, status: SeatStatus.FOLDED },
        { userId: 'p3', position: 2, status: SeatStatus.ACTIVE },
      ];

      const firstActor = service.getFirstActorPostflop(0, players);
      expect(firstActor).toBe(2);
    });
  });
});
