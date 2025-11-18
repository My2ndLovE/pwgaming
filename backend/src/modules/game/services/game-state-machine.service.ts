import { Injectable } from '@nestjs/common';
import { HandPhase } from '../entities/game-hand.entity';
import { SeatStatus } from '../entities/player-seat.entity';

export interface PlayerState {
  userId: string;
  position: number;
  chipStack?: number;
  currentBet?: number;
  status: SeatStatus;
  hasActed?: boolean;
}

export interface GameState {
  phase: HandPhase;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentBet: number;
  minRaise: number;
  currentPosition: number;
  activePlayers: PlayerState[];
}

@Injectable()
export class GameStateMachine {
  /**
   * Initializes a new hand state
   */
  initializeHand(
    players: Array<{ userId: string; chipStack: number; position: number }>,
    dealerPosition: number,
    _smallBlind: number,
    bigBlind: number,
  ): GameState {
    const numPlayers = players.length;
    const isHeadsUp = numPlayers === 2;

    let smallBlindPosition: number;
    let bigBlindPosition: number;
    let firstActor: number;

    if (isHeadsUp) {
      // Heads-up: dealer posts SB, other player posts BB
      smallBlindPosition = dealerPosition;
      bigBlindPosition = (dealerPosition + 1) % numPlayers;
      firstActor = dealerPosition; // Dealer acts first preflop in heads-up
    } else {
      // 3+ players: SB left of dealer, BB left of SB
      smallBlindPosition = (dealerPosition + 1) % numPlayers;
      bigBlindPosition = (dealerPosition + 2) % numPlayers;
      firstActor = (bigBlindPosition + 1) % numPlayers; // UTG
    }

    const activePlayers = players.map((p) => ({
      userId: p.userId,
      position: p.position,
      chipStack: p.chipStack,
      currentBet: 0,
      status: SeatStatus.ACTIVE,
      hasActed: false,
    }));

    return {
      phase: HandPhase.PREFLOP,
      dealerPosition,
      smallBlindPosition,
      bigBlindPosition,
      currentBet: bigBlind,
      minRaise: bigBlind,
      currentPosition: firstActor,
      activePlayers,
    };
  }

  /**
   * Advances to the next phase of the hand
   */
  advancePhase(currentState: GameState): GameState {
    const phaseOrder = [
      HandPhase.PREFLOP,
      HandPhase.FLOP,
      HandPhase.TURN,
      HandPhase.RIVER,
      HandPhase.SHOWDOWN,
    ];

    const currentIndex = phaseOrder.indexOf(currentState.phase);
    const nextPhase = phaseOrder[currentIndex + 1] || HandPhase.SHOWDOWN;

    // Reset betting for new phase
    const newState = {
      ...currentState,
      phase: nextPhase,
      currentBet: 0,
      currentPosition: this.getFirstActorPostflop(
        currentState.dealerPosition,
        currentState.activePlayers,
      ),
      activePlayers: currentState.activePlayers.map((p) => ({
        ...p,
        currentBet: 0,
        hasActed: false,
      })),
    };

    // Keep minRaise from previous round (for proper raise sizing)
    return newState;
  }

  /**
   * Gets the next player position in turn order
   */
  getNextPosition(currentPosition: number, players: PlayerState[]): number {
    if (players.length === 0) return -1;

    const maxPosition = Math.max(...players.map((p) => p.position));
    let nextPosition = (currentPosition + 1) % (maxPosition + 1);
    let attempts = 0;
    const maxAttempts = maxPosition + 1;

    while (attempts < maxAttempts) {
      const player = players.find((p) => p.position === nextPosition);

      if (
        player &&
        player.status !== SeatStatus.FOLDED &&
        player.status !== SeatStatus.ALL_IN &&
        player.status !== SeatStatus.SITTING_OUT
      ) {
        return nextPosition;
      }

      nextPosition = (nextPosition + 1) % (maxPosition + 1);
      attempts++;
    }

    return -1; // No active players found
  }

  /**
   * Checks if the current betting round is complete
   */
  isBettingRoundComplete(state: {
    currentBet: number;
    activePlayers: Array<{
      currentBet?: number;
      status: SeatStatus;
      hasActed?: boolean;
    }>;
  }): boolean {
    const actionablePlayers = state.activePlayers.filter(
      (p) => p.status === SeatStatus.ACTIVE,
    );

    // Only one active player left (others folded/all-in)
    if (actionablePlayers.length <= 1) {
      return true;
    }

    // All actionable players have acted and matched the bet
    return actionablePlayers.every(
      (p) => (p.hasActed || false) && (p.currentBet || 0) === state.currentBet,
    );
  }

  /**
   * Checks if the entire hand is complete
   */
  isHandComplete(
    players: Array<{ status: SeatStatus }>,
    phase: HandPhase,
  ): boolean {
    // Hand complete if at showdown
    if (phase === HandPhase.SHOWDOWN) {
      return true;
    }

    // Hand complete if only one player remains (others folded)
    const activePlayers = players.filter(
      (p) =>
        p.status !== SeatStatus.FOLDED && p.status !== SeatStatus.SITTING_OUT,
    );

    return activePlayers.length === 1;
  }

  /**
   * Calculates the next dealer position
   */
  calculateNextDealer(
    currentDealer: number,
    players: Array<{ position: number }>,
  ): number {
    const positions = players.map((p) => p.position).sort((a, b) => a - b);
    const currentIndex = positions.indexOf(currentDealer);
    const nextIndex = (currentIndex + 1) % positions.length;
    return positions[nextIndex];
  }

  /**
   * Gets the first player to act preflop
   */
  getFirstActorPreflop(bigBlindPosition: number, numPlayers: number): number {
    if (numPlayers === 2) {
      // Heads-up: dealer (small blind) acts first preflop
      return (bigBlindPosition + 1) % numPlayers;
    }
    // 3+ players: UTG (left of big blind) acts first
    return (bigBlindPosition + 1) % numPlayers;
  }

  /**
   * Gets the first player to act postflop (SB or first active after dealer)
   */
  getFirstActorPostflop(
    dealerPosition: number,
    players: PlayerState[],
  ): number {
    if (players.length === 0) return -1;

    const maxPosition = Math.max(...players.map((p) => p.position));
    let position = (dealerPosition + 1) % (maxPosition + 1);
    let attempts = 0;
    const maxAttempts = maxPosition + 1;

    while (attempts < maxAttempts) {
      const player = players.find((p) => p.position === position);

      if (
        player &&
        player.status !== SeatStatus.FOLDED &&
        player.status !== SeatStatus.ALL_IN &&
        player.status !== SeatStatus.SITTING_OUT
      ) {
        return position;
      }

      position = (position + 1) % (maxPosition + 1);
      attempts++;
    }

    return -1;
  }
}
