import { Injectable } from '@nestjs/common';
import { ActionType } from '../entities/betting-action.entity';
import { SeatStatus } from '../entities/player-seat.entity';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestedAction?: ActionType;
}

export interface PlayerState {
  chipStack: number;
  currentBet: number;
  status: SeatStatus;
  hasActed: boolean;
}

export interface GameState {
  currentBet: number;
  minRaise: number;
  smallBlind: number;
  bigBlind: number;
}

@Injectable()
export class BettingService {
  /**
   * Validates a player's action according to poker rules
   */
  validateAction(
    action: ActionType,
    amount: number,
    player: PlayerState,
    gameState: GameState
  ): ValidationResult {
    // Check player status first
    if (player.status === SeatStatus.FOLDED) {
      return { isValid: false, error: 'Player has already folded' };
    }
    if (player.status === SeatStatus.ALL_IN) {
      return { isValid: false, error: 'Player is already all-in' };
    }
    if (player.status === SeatStatus.SITTING_OUT) {
      return { isValid: false, error: 'Player is sitting out' };
    }

    switch (action) {
      case ActionType.FOLD:
        return this.validateFold(amount);

      case ActionType.CHECK:
        return this.validateCheck(amount, player, gameState);

      case ActionType.CALL:
        return this.validateCall(amount, player, gameState);

      case ActionType.BET:
        return this.validateBet(amount, player, gameState);

      case ActionType.RAISE:
        return this.validateRaise(amount, player, gameState);

      case ActionType.ALL_IN:
        return this.validateAllIn(amount, player, gameState);

      default:
        return { isValid: false, error: 'Unknown action type' };
    }
  }

  /**
   * Calculates the minimum raise amount
   */
  calculateMinimumRaise(currentBet: number, minRaise: number, bigBlind: number): number {
    if (currentBet === 0) {
      return bigBlind;
    }
    return currentBet + minRaise;
  }

  /**
   * Determines if a player must go all-in for a given action
   */
  isAllInSituation(chipStack: number, currentBet: number, bigBlind: number): boolean {
    if (currentBet > 0 && chipStack < currentBet) {
      return true;
    }
    if (currentBet === 0 && chipStack < bigBlind) {
      return true;
    }
    return false;
  }

  // Private validation methods

  private validateFold(amount: number): ValidationResult {
    if (amount !== 0) {
      return { isValid: false, error: 'Fold action must have zero amount' };
    }
    return { isValid: true };
  }

  private validateCheck(amount: number, player: PlayerState, gameState: GameState): ValidationResult {
    if (amount !== 0) {
      return { isValid: false, error: 'Check action must have zero amount' };
    }

    const amountToCall = gameState.currentBet - player.currentBet;
    if (amountToCall > 0) {
      return { isValid: false, error: 'Cannot check when there is a bet to call' };
    }

    return { isValid: true };
  }

  private validateCall(amount: number, player: PlayerState, gameState: GameState): ValidationResult {
    const amountToCall = gameState.currentBet - player.currentBet;

    if (gameState.currentBet === 0) {
      return { isValid: false, error: 'Cannot call when there is no bet' };
    }

    if (amount !== amountToCall) {
      // Check if player doesn't have enough chips (should be all-in)
      if (player.chipStack < amountToCall) {
        return {
          isValid: false,
          error: 'Insufficient chips to call',
          suggestedAction: ActionType.ALL_IN,
        };
      }

      return {
        isValid: false,
        error: `Call amount must match the current bet (${gameState.currentBet})`,
      };
    }

    return { isValid: true };
  }

  private validateBet(amount: number, player: PlayerState, gameState: GameState): ValidationResult {
    if (gameState.currentBet > 0) {
      return {
        isValid: false,
        error: 'Cannot bet when there is already a bet (use raise)',
        suggestedAction: ActionType.RAISE,
      };
    }

    if (amount < gameState.bigBlind) {
      return {
        isValid: false,
        error: `Bet must be at least the big blind (${gameState.bigBlind})`,
      };
    }

    if (amount > player.chipStack) {
      return {
        isValid: false,
        error: 'Bet amount exceeds chip stack',
      };
    }

    return { isValid: true };
  }

  private validateRaise(amount: number, player: PlayerState, gameState: GameState): ValidationResult {
    if (gameState.currentBet === 0) {
      return {
        isValid: false,
        error: 'Cannot raise when there is no bet (use bet)',
        suggestedAction: ActionType.BET,
      };
    }

    const minimumRaise = this.calculateMinimumRaise(
      gameState.currentBet,
      gameState.minRaise,
      gameState.bigBlind
    );

    if (amount < minimumRaise) {
      return {
        isValid: false,
        error: `Raise must be at least ${minimumRaise} (current bet + minimum raise)`,
      };
    }

    if (amount > player.chipStack) {
      return {
        isValid: false,
        error: 'Raise amount exceeds chip stack',
      };
    }

    return { isValid: true };
  }

  private validateAllIn(amount: number, player: PlayerState, gameState: GameState): ValidationResult {
    if (amount !== player.chipStack) {
      return {
        isValid: false,
        error: `All-in amount must equal entire chip stack (${player.chipStack})`,
      };
    }

    return { isValid: true };
  }
}
