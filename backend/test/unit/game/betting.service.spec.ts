import { BettingService } from '../../../src/modules/game/services/betting.service';
import { ActionType } from '../../../src/modules/game/entities/betting-action.entity';
import { SeatStatus } from '../../../src/modules/game/entities/player-seat.entity';

describe('BettingService', () => {
  let service: BettingService;

  beforeEach(() => {
    service = new BettingService();
  });

  describe('validateAction', () => {
    const mockGameState = {
      currentBet: 100,
      minRaise: 100,
      smallBlind: 50,
      bigBlind: 100,
    };

    const mockPlayer = {
      chipStack: 1000,
      currentBet: 0,
      status: SeatStatus.ACTIVE,
      hasActed: false,
    };

    describe('FOLD action', () => {
      it('should allow fold action when there is a bet', () => {
        const result = service.validateAction(
          ActionType.FOLD,
          0,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should allow fold action even with no bet (player wants to fold)', () => {
        const result = service.validateAction(
          ActionType.FOLD,
          0,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject fold with non-zero amount', () => {
        const result = service.validateAction(
          ActionType.FOLD,
          50,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Fold action must have zero amount');
      });
    });

    describe('CHECK action', () => {
      it('should allow check when no bet exists', () => {
        const result = service.validateAction(
          ActionType.CHECK,
          0,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(true);
      });

      it('should allow check when player already matched current bet', () => {
        const result = service.validateAction(
          ActionType.CHECK,
          0,
          { ...mockPlayer, currentBet: 100 },
          mockGameState
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject check when there is an unmatched bet', () => {
        const result = service.validateAction(
          ActionType.CHECK,
          0,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Cannot check when there is a bet to call');
      });

      it('should reject check with non-zero amount', () => {
        const result = service.validateAction(
          ActionType.CHECK,
          50,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Check action must have zero amount');
      });
    });

    describe('CALL action', () => {
      it('should allow call with exact amount to match bet', () => {
        const result = service.validateAction(
          ActionType.CALL,
          100,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject call when no bet exists', () => {
        const result = service.validateAction(
          ActionType.CALL,
          0,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Cannot call when there is no bet');
      });

      it('should reject call with incorrect amount', () => {
        const result = service.validateAction(
          ActionType.CALL,
          50,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Call amount must match the current bet (100)');
      });

      it('should handle call when player has insufficient chips (auto all-in)', () => {
        const result = service.validateAction(
          ActionType.CALL,
          50,
          { ...mockPlayer, chipStack: 50 },
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.suggestedAction).toBe(ActionType.ALL_IN);
      });
    });

    describe('BET action', () => {
      it('should allow bet when no current bet exists', () => {
        const result = service.validateAction(
          ActionType.BET,
          200,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject bet when a bet already exists (should be raise)', () => {
        const result = service.validateAction(
          ActionType.BET,
          200,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Cannot bet when there is already a bet (use raise)');
        expect(result.suggestedAction).toBe(ActionType.RAISE);
      });

      it('should enforce minimum bet of big blind', () => {
        const result = service.validateAction(
          ActionType.BET,
          50,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Bet must be at least the big blind (100)');
      });

      it('should reject bet exceeding chip stack', () => {
        const result = service.validateAction(
          ActionType.BET,
          2000,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Bet amount exceeds chip stack');
      });
    });

    describe('RAISE action', () => {
      it('should allow valid raise with minimum raise amount', () => {
        const result = service.validateAction(
          ActionType.RAISE,
          200,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject raise when no bet exists (should be bet)', () => {
        const result = service.validateAction(
          ActionType.RAISE,
          200,
          mockPlayer,
          { ...mockGameState, currentBet: 0 }
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Cannot raise when there is no bet (use bet)');
        expect(result.suggestedAction).toBe(ActionType.BET);
      });

      it('should enforce minimum raise amount', () => {
        const result = service.validateAction(
          ActionType.RAISE,
          150,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Raise must be at least 200 (current bet + minimum raise)');
      });

      it('should reject raise exceeding chip stack', () => {
        const result = service.validateAction(
          ActionType.RAISE,
          2000,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Raise amount exceeds chip stack');
      });

      it('should calculate minimum raise correctly after multiple raises', () => {
        const gameStateWithRaise = {
          ...mockGameState,
          currentBet: 300,
          minRaise: 200, // Last raise was 200
        };

        const result = service.validateAction(
          ActionType.RAISE,
          450,
          mockPlayer,
          gameStateWithRaise
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Raise must be at least 500 (current bet + minimum raise)');
      });
    });

    describe('ALL_IN action', () => {
      it('should allow all-in with entire chip stack', () => {
        const result = service.validateAction(
          ActionType.ALL_IN,
          1000,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(true);
      });

      it('should reject all-in with amount less than chip stack', () => {
        const result = service.validateAction(
          ActionType.ALL_IN,
          500,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('All-in amount must equal entire chip stack (1000)');
      });

      it('should reject all-in with amount greater than chip stack', () => {
        const result = service.validateAction(
          ActionType.ALL_IN,
          1500,
          mockPlayer,
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('All-in amount must equal entire chip stack (1000)');
      });

      it('should allow all-in even when less than minimum raise', () => {
        const result = service.validateAction(
          ActionType.ALL_IN,
          50,
          { ...mockPlayer, chipStack: 50 },
          mockGameState
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('Player status validation', () => {
      it('should reject action from folded player', () => {
        const result = service.validateAction(
          ActionType.CALL,
          100,
          { ...mockPlayer, status: SeatStatus.FOLDED },
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Player has already folded');
      });

      it('should reject action from all-in player', () => {
        const result = service.validateAction(
          ActionType.CALL,
          100,
          { ...mockPlayer, status: SeatStatus.ALL_IN },
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Player is already all-in');
      });

      it('should reject action from sitting out player', () => {
        const result = service.validateAction(
          ActionType.CALL,
          100,
          { ...mockPlayer, status: SeatStatus.SITTING_OUT },
          mockGameState
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Player is sitting out');
      });
    });
  });

  describe('calculateMinimumRaise', () => {
    it('should return big blind for first bet', () => {
      const minRaise = service.calculateMinimumRaise(0, 100, 100);
      expect(minRaise).toBe(100);
    });

    it('should return current bet + last raise size', () => {
      const minRaise = service.calculateMinimumRaise(300, 200, 100);
      expect(minRaise).toBe(500); // 300 + 200
    });

    it('should handle initial big blind raise', () => {
      const minRaise = service.calculateMinimumRaise(100, 100, 100);
      expect(minRaise).toBe(200); // 100 + 100
    });
  });

  describe('isAllInSituation', () => {
    it('should detect when player must go all-in to call', () => {
      const isAllIn = service.isAllInSituation(50, 100, 0);
      expect(isAllIn).toBe(true);
    });

    it('should detect when player must go all-in to bet minimum', () => {
      const isAllIn = service.isAllInSituation(80, 0, 100);
      expect(isAllIn).toBe(true);
    });

    it('should return false when player has enough chips', () => {
      const isAllIn = service.isAllInSituation(500, 100, 100);
      expect(isAllIn).toBe(false);
    });
  });
});
