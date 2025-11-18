import { Injectable } from '@nestjs/common';
import { GameState, PlayerState } from './game-state-machine.service';
import { SeatStatus } from '../entities/player-seat.entity';
import { HandPhase } from '../entities/game-hand.entity';

export type BlindType = 'small' | 'big';

@Injectable()
export class BlindService {
  /**
   * Posts small blind for a player
   * @param player - The player posting the small blind
   * @param smallBlind - The small blind amount
   * @returns Updated player state
   */
  postSmallBlind(player: PlayerState, smallBlind: number): PlayerState {
    const updatedPlayer = { ...player };

    if (player.chipStack !== undefined && player.chipStack >= smallBlind) {
      // Normal case: enough chips to post full blind
      updatedPlayer.chipStack = player.chipStack - smallBlind;
      updatedPlayer.currentBet = smallBlind;
    } else if (player.chipStack !== undefined) {
      // All-in case: not enough chips for full blind
      updatedPlayer.currentBet = player.chipStack;
      updatedPlayer.chipStack = 0;
      updatedPlayer.status = SeatStatus.ALL_IN;
    }

    return updatedPlayer;
  }

  /**
   * Posts big blind for a player
   * @param player - The player posting the big blind
   * @param bigBlind - The big blind amount
   * @returns Updated player state
   */
  postBigBlind(player: PlayerState, bigBlind: number): PlayerState {
    const updatedPlayer = { ...player };

    if (player.chipStack !== undefined && player.chipStack >= bigBlind) {
      // Normal case: enough chips to post full blind
      updatedPlayer.chipStack = player.chipStack - bigBlind;
      updatedPlayer.currentBet = bigBlind;
    } else if (player.chipStack !== undefined) {
      // All-in case: not enough chips for full blind
      updatedPlayer.currentBet = player.chipStack;
      updatedPlayer.chipStack = 0;
      updatedPlayer.status = SeatStatus.ALL_IN;
    }

    return updatedPlayer;
  }

  /**
   * Posts both small and big blinds for the game state
   * @param state - Current game state
   * @param smallBlind - Small blind amount
   * @param bigBlind - Big blind amount
   * @returns Updated game state with blinds posted
   */
  postBlinds(
    state: GameState,
    smallBlind: number,
    bigBlind: number,
  ): GameState {
    const updatedState = { ...state };

    // Update players with posted blinds
    updatedState.activePlayers = state.activePlayers.map((player) => {
      if (player.position === state.smallBlindPosition) {
        return this.postSmallBlind(player, smallBlind);
      }
      if (player.position === state.bigBlindPosition) {
        return this.postBigBlind(player, bigBlind);
      }
      return player;
    });

    // Set current bet to big blind amount
    updatedState.currentBet = bigBlind;
    updatedState.minRaise = bigBlind;

    return updatedState;
  }

  /**
   * Determines if the big blind has the option to raise
   * (only in preflop when action returns to BB and no one has raised beyond BB)
   * @param state - Current game state
   * @returns True if BB has the option to raise
   */
  hasBigBlindOption(state: GameState): boolean {
    // BB option only applies in preflop
    if (state.phase !== HandPhase.PREFLOP) {
      return false;
    }

    // Find the big blind player
    const bbPlayer = state.activePlayers.find(
      (p) => p.position === state.bigBlindPosition,
    );

    if (!bbPlayer) {
      return false;
    }

    // BB option only applies when:
    // 1. Current position is the big blind
    // 2. BB hasn't acted yet (hasActed === false)
    // 3. Current bet equals the original big blind (no raises)
    const bigBlindAmount = bbPlayer.currentBet;

    return (
      state.currentPosition === state.bigBlindPosition &&
      !bbPlayer.hasActed &&
      state.currentBet === bigBlindAmount
    );
  }

  /**
   * Gets the blind amount for the specified blind type
   * @param blindType - 'small' or 'big'
   * @param smallBlind - Small blind amount
   * @param bigBlind - Big blind amount
   * @returns The blind amount
   */
  getBlindAmount(
    blindType: BlindType,
    smallBlind: number,
    bigBlind: number,
  ): number {
    if (blindType === 'small') {
      return smallBlind;
    }
    if (blindType === 'big') {
      return bigBlind;
    }
    throw new Error(`Invalid blind type: ${blindType}`);
  }
}
