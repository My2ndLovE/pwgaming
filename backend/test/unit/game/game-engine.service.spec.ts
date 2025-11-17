import { GameEngine } from '../../../src/modules/game/services/game-engine.service';
import { DeckService } from '../../../src/modules/game/services/deck.service';
import { HandEvaluatorService } from '../../../src/modules/game/services/hand-evaluator.service';
import { PotService } from '../../../src/modules/game/services/pot.service';
import { BettingService } from '../../../src/modules/game/services/betting.service';
import { BlindService } from '../../../src/modules/game/services/blind.service';
import { GameStateMachine } from '../../../src/modules/game/services/game-state-machine.service';
import { HandPhase } from '../../../src/modules/game/entities/game-hand.entity';
import { ActionType } from '../../../src/modules/game/entities/betting-action.entity';
import { SeatStatus } from '../../../src/modules/game/entities/player-seat.entity';

describe('GameEngine', () => {
  let engine: GameEngine;
  let deckService: DeckService;
  let handEvaluator: HandEvaluatorService;
  let potService: PotService;
  let bettingService: BettingService;
  let blindService: BlindService;
  let stateMachine: GameStateMachine;

  beforeEach(() => {
    deckService = new DeckService();
    handEvaluator = new HandEvaluatorService();
    potService = new PotService();
    bettingService = new BettingService();
    blindService = new BlindService();
    stateMachine = new GameStateMachine();

    engine = new GameEngine(
      deckService,
      handEvaluator,
      potService,
      bettingService,
      blindService,
      stateMachine
    );
  });

  describe('startNewHand', () => {
    it('should initialize a new hand with deck, blinds, and state', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];

      const result = engine.startNewHand(players, 0, 50, 100);

      expect(result.state.phase).toBe(HandPhase.PREFLOP);
      expect(result.state.dealerPosition).toBe(0);
      expect(result.state.currentBet).toBe(100);
      expect(result.deck).toHaveLength(46); // 52 - 6 cards dealt
      expect(result.communityCards).toEqual([]);
      expect(result.playerHands).toHaveLength(3);
    });

    it('should deal 2 hole cards to each player', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
      ];

      const result = engine.startNewHand(players, 0, 50, 100);

      result.playerHands.forEach(hand => {
        expect(hand.cards).toHaveLength(2);
      });
    });

    it('should have 46 cards remaining after dealing to 3 players', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];

      const result = engine.startNewHand(players, 0, 50, 100);

      expect(result.deck).toHaveLength(46); // 52 - 6 cards dealt
    });

    it('should deduct blinds from chip stacks', () => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];

      const result = engine.startNewHand(players, 0, 50, 100);

      // SB at position 1 should have 950 chips
      const sbPlayer = result.state.activePlayers.find(p => p.position === 1);
      expect(sbPlayer?.chipStack).toBe(950);

      // BB at position 2 should have 900 chips
      const bbPlayer = result.state.activePlayers.find(p => p.position === 2);
      expect(bbPlayer?.chipStack).toBe(900);
    });
  });

  describe('processAction', () => {
    let handState: any;

    beforeEach(() => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];
      handState = engine.startNewHand(players, 0, 50, 100);
    });

    it('should process a valid fold action', () => {
      const result = engine.processAction(
        handState,
        'p1',
        ActionType.FOLD,
        0
      );

      expect(result.success).toBe(true);
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.status).toBe(SeatStatus.FOLDED);
    });

    it('should process a valid call action', () => {
      const result = engine.processAction(
        handState,
        'p1',
        ActionType.CALL,
        100
      );

      expect(result.success).toBe(true);
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.currentBet).toBe(100);
      expect(player?.chipStack).toBe(900); // 1000 - 100
    });

    it('should process a valid raise action', () => {
      const result = engine.processAction(
        handState,
        'p1',
        ActionType.RAISE,
        200
      );

      expect(result.success).toBe(true);
      expect(result.state.currentBet).toBe(200);
      expect(result.state.minRaise).toBe(100); // raise size
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.chipStack).toBe(800);
    });

    it('should process a valid check action', () => {
      // Set up state where check is valid (no current bet)
      handState.state.currentBet = 0;
      handState.state.activePlayers = handState.state.activePlayers.map(p => ({
        ...p,
        currentBet: 0,
      }));

      const result = engine.processAction(
        handState,
        'p1',
        ActionType.CHECK,
        0
      );

      expect(result.success).toBe(true);
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.hasActed).toBe(true);
    });

    it('should process a valid bet action', () => {
      // Set up state where bet is valid (no current bet)
      handState.state.currentBet = 0;
      handState.state.activePlayers = handState.state.activePlayers.map(p => ({
        ...p,
        currentBet: 0,
      }));

      const result = engine.processAction(
        handState,
        'p1',
        ActionType.BET,
        150
      );

      expect(result.success).toBe(true);
      expect(result.state.currentBet).toBe(150);
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.chipStack).toBe(850);
    });

    it('should process a valid all-in action', () => {
      const result = engine.processAction(
        handState,
        'p1',
        ActionType.ALL_IN,
        1000
      );

      expect(result.success).toBe(true);
      const player = result.state.activePlayers.find(p => p.userId === 'p1');
      expect(player?.status).toBe(SeatStatus.ALL_IN);
      expect(player?.chipStack).toBe(0);
    });

    it('should reject action from player out of turn', () => {
      const result = engine.processAction(
        handState,
        'p2', // Not current player
        ActionType.CALL,
        100
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not your turn');
    });

    it('should reject invalid action', () => {
      const result = engine.processAction(
        handState,
        'p1',
        ActionType.CHECK, // Can't check when there's a bet
        0
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should advance turn to next player after action', () => {
      const initialPosition = handState.state.currentPosition;

      engine.processAction(handState, 'p1', ActionType.CALL, 100);

      // Should advance to next player
      expect(handState.state.currentPosition).not.toBe(initialPosition);
    });

    it('should reject action from non-existent player', () => {
      const result = engine.processAction(
        handState,
        'non-existent-player',
        ActionType.CALL,
        100
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });
  });

  describe('advanceToNextPhase', () => {
    let handState: any;

    beforeEach(() => {
      const players = [
        { userId: 'p1', chipStack: 1000, position: 0 },
        { userId: 'p2', chipStack: 1000, position: 1 },
        { userId: 'p3', chipStack: 1000, position: 2 },
      ];
      handState = engine.startNewHand(players, 0, 50, 100);
    });

    it('should deal flop (3 cards) when advancing from PREFLOP', () => {
      const result = engine.advanceToNextPhase(handState);

      expect(result.state.phase).toBe(HandPhase.FLOP);
      expect(result.communityCards).toHaveLength(3);
      expect(result.deck).toHaveLength(42); // 46 - 1 burn - 3 flop
    });

    it('should deal turn (1 card) when advancing from FLOP', () => {
      handState.state.phase = HandPhase.FLOP;
      handState.communityCards = ['Ah', 'Kh', 'Qh'];

      const result = engine.advanceToNextPhase(handState);

      expect(result.state.phase).toBe(HandPhase.TURN);
      expect(result.communityCards).toHaveLength(4);
    });

    it('should deal river (1 card) when advancing from TURN', () => {
      handState.state.phase = HandPhase.TURN;
      handState.communityCards = ['Ah', 'Kh', 'Qh', 'Jh'];

      const result = engine.advanceToNextPhase(handState);

      expect(result.state.phase).toBe(HandPhase.RIVER);
      expect(result.communityCards).toHaveLength(5);
    });

    it('should go to SHOWDOWN when advancing from RIVER', () => {
      handState.state.phase = HandPhase.RIVER;
      handState.communityCards = ['Ah', 'Kh', 'Qh', 'Jh', 'Th'];

      const result = engine.advanceToNextPhase(handState);

      expect(result.state.phase).toBe(HandPhase.SHOWDOWN);
    });

    it('should reset betting state when advancing phase', () => {
      handState.state.currentBet = 200;

      const result = engine.advanceToNextPhase(handState);

      expect(result.state.currentBet).toBe(0);
    });
  });

  describe('evaluateWinners', () => {
    it('should determine single winner with best hand', () => {
      const playerHands = [
        { userId: 'p1', cards: ['As', 'Ah'] }, // Pair of aces
        { userId: 'p2', cards: ['Ks', 'Kh'] }, // Pair of kings
        { userId: 'p3', cards: ['2s', '3h'] }, // High card
      ];

      const communityCards = ['Ad', '7c', '8d', '9h', 'Tc'];

      const winners = engine.evaluateWinners(playerHands, communityCards);

      expect(winners).toHaveLength(1);
      expect(winners[0].userId).toBe('p1');
    });

    it('should handle split pot for tied hands', () => {
      const playerHands = [
        { userId: 'p1', cards: ['As', 'Kh'] },
        { userId: 'p2', cards: ['Ad', 'Kd'] }, // Same hand
      ];

      const communityCards = ['Qh', 'Jc', 'Th', '9s', '2c'];

      const winners = engine.evaluateWinners(playerHands, communityCards);

      expect(winners).toHaveLength(2);
      expect(winners.map(w => w.userId)).toContain('p1');
      expect(winners.map(w => w.userId)).toContain('p2');
    });

    it('should award entire pot to winner when only one active player', () => {
      const playerHands = [
        { userId: 'p1', cards: ['As', 'Ah'], status: SeatStatus.ACTIVE },
        { userId: 'p2', cards: ['Ks', 'Kh'], status: SeatStatus.FOLDED },
      ];

      const winners = engine.evaluateWinners(playerHands, []);

      expect(winners).toHaveLength(1);
      expect(winners[0].userId).toBe('p1');
    });
  });

  describe('calculatePots', () => {
    it('should calculate main pot correctly', () => {
      const contributions = [
        { userId: 'p1', amount: 100 },
        { userId: 'p2', amount: 100 },
        { userId: 'p3', amount: 100 },
      ];

      const pots = engine.calculatePots(contributions);

      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toHaveLength(3);
    });

    it('should create side pots for all-in situations', () => {
      const contributions = [
        { userId: 'p1', amount: 50 },  // All-in
        { userId: 'p2', amount: 100 },
        { userId: 'p3', amount: 100 },
      ];

      const pots = engine.calculatePots(contributions);

      expect(pots.length).toBeGreaterThan(1);
      expect(pots[0].amount).toBe(150); // 50 * 3
      expect(pots[1].amount).toBe(100); // 50 * 2 from remaining players
    });
  });

  describe('isHandComplete', () => {
    it('should return true when only one player remains active', () => {
      const players = [
        { userId: 'p1', status: SeatStatus.ACTIVE },
        { userId: 'p2', status: SeatStatus.FOLDED },
        { userId: 'p3', status: SeatStatus.FOLDED },
      ];

      const isComplete = engine.isHandComplete(players, HandPhase.FLOP);

      expect(isComplete).toBe(true);
    });

    it('should return true at SHOWDOWN phase', () => {
      const players = [
        { userId: 'p1', status: SeatStatus.ACTIVE },
        { userId: 'p2', status: SeatStatus.ACTIVE },
      ];

      const isComplete = engine.isHandComplete(players, HandPhase.SHOWDOWN);

      expect(isComplete).toBe(true);
    });

    it('should return false when multiple players active', () => {
      const players = [
        { userId: 'p1', status: SeatStatus.ACTIVE },
        { userId: 'p2', status: SeatStatus.ACTIVE },
      ];

      const isComplete = engine.isHandComplete(players, HandPhase.FLOP);

      expect(isComplete).toBe(false);
    });
  });

  describe('isBettingRoundComplete', () => {
    it('should return true when all players have acted and matched bet', () => {
      const state = {
        currentBet: 100,
        activePlayers: [
          { currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
        ],
      };

      const isComplete = engine.isBettingRoundComplete(state);

      expect(isComplete).toBe(true);
    });

    it('should return false when players have not acted', () => {
      const state = {
        currentBet: 100,
        activePlayers: [
          { currentBet: 100, status: SeatStatus.ACTIVE, hasActed: true },
          { currentBet: 100, status: SeatStatus.ACTIVE, hasActed: false },
        ],
      };

      const isComplete = engine.isBettingRoundComplete(state);

      expect(isComplete).toBe(false);
    });
  });
});
