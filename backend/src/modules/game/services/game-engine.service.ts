import { Injectable } from '@nestjs/common';
import { DeckService } from './deck.service';
import { HandEvaluatorService } from './hand-evaluator.service';
import { PotService } from './pot.service';
import { BettingService } from './betting.service';
import { BlindService } from './blind.service';
import { GameStateMachine, GameState, PlayerState } from './game-state-machine.service';
import { HandPhase } from '../entities/game-hand.entity';
import { ActionType } from '../entities/betting-action.entity';
import { SeatStatus } from '../entities/player-seat.entity';

export interface HandState {
  state: GameState;
  deck: string[];
  communityCards: string[];
  playerHands: Array<{
    userId: string;
    cards: string[];
    status?: SeatStatus;
  }>;
}

export interface ActionResult {
  success: boolean;
  state: GameState;
  error?: string;
}

export interface WinnerInfo {
  userId: string;
  handName: string;
  handCards: string[];
}

export interface Pot {
  amount: number;
  eligiblePlayers: string[];
}

@Injectable()
export class GameEngine {
  constructor(
    private readonly deckService: DeckService,
    private readonly handEvaluator: HandEvaluatorService,
    private readonly potService: PotService,
    private readonly bettingService: BettingService,
    private readonly blindService: BlindService,
    private readonly stateMachine: GameStateMachine
  ) {}

  /**
   * Starts a new hand: shuffles deck, deals cards, posts blinds
   */
  startNewHand(
    players: Array<{ userId: string; chipStack: number; position: number }>,
    dealerPosition: number,
    smallBlind: number,
    bigBlind: number
  ): HandState {
    // Initialize game state
    const state = this.stateMachine.initializeHand(
      players,
      dealerPosition,
      smallBlind,
      bigBlind
    );

    // Create and shuffle deck
    const deck = this.deckService.createDeck();
    const shuffledDeck = this.deckService.shuffle(deck);

    // Post blinds using BlindService
    const stateWithBlinds = this.blindService.postBlinds(state, smallBlind, bigBlind);

    // Deal 2 cards to each player
    let remainingDeck = shuffledDeck;
    const playerHands: Array<{ userId: string; cards: string[] }> = [];

    players.forEach(player => {
      const { dealt, remaining } = this.deckService.dealCards(remainingDeck, 2);
      playerHands.push({
        userId: player.userId,
        cards: dealt,
      });
      remainingDeck = remaining;
    });

    return {
      state: stateWithBlinds,
      deck: remainingDeck,
      communityCards: [],
      playerHands,
    };
  }

  /**
   * Processes a player action
   */
  processAction(
    handState: HandState,
    userId: string,
    action: ActionType,
    amount: number
  ): ActionResult {
    // Find player
    const player = handState.state.activePlayers.find(p => p.userId === userId);
    if (!player) {
      return {
        success: false,
        state: handState.state,
        error: 'Player not found',
      };
    }

    // Check if it's player's turn
    if (player.position !== handState.state.currentPosition) {
      return {
        success: false,
        state: handState.state,
        error: 'It is not your turn',
      };
    }

    // Validate action
    const validation = this.bettingService.validateAction(
      action,
      amount,
      player,
      handState.state
    );

    if (!validation.isValid) {
      return {
        success: false,
        state: handState.state,
        error: validation.error,
      };
    }

    // Apply action to game state
    const newState = this.applyAction(handState.state, player, action, amount);

    // Update hand state
    handState.state = newState;

    return {
      success: true,
      state: newState,
    };
  }

  /**
   * Advances to the next phase (flop, turn, river, showdown)
   * Burns one card before dealing community cards (standard poker procedure)
   */
  advanceToNextPhase(handState: HandState): HandState {
    const currentPhase = handState.state.phase;

    // Deal community cards based on phase
    if (currentPhase === HandPhase.PREFLOP) {
      // Burn 1 card before dealing flop
      const burnResult = this.deckService.burnCard(handState.deck);
      let remainingDeck = burnResult.remaining;

      // Deal flop (3 cards)
      const { dealt, remaining } = this.deckService.dealCards(remainingDeck, 3);
      handState.communityCards = dealt;
      handState.deck = remaining;
    } else if (currentPhase === HandPhase.FLOP) {
      // Burn 1 card before dealing turn
      const burnResult = this.deckService.burnCard(handState.deck);
      let remainingDeck = burnResult.remaining;

      // Deal turn (1 card)
      const { dealt, remaining } = this.deckService.dealCards(remainingDeck, 1);
      handState.communityCards.push(dealt[0]);
      handState.deck = remaining;
    } else if (currentPhase === HandPhase.TURN) {
      // Burn 1 card before dealing river
      const burnResult = this.deckService.burnCard(handState.deck);
      let remainingDeck = burnResult.remaining;

      // Deal river (1 card)
      const { dealt, remaining } = this.deckService.dealCards(remainingDeck, 1);
      handState.communityCards.push(dealt[0]);
      handState.deck = remaining;
    }

    // Advance game state
    handState.state = this.stateMachine.advancePhase(handState.state);

    return handState;
  }

  /**
   * Evaluates all hands and determines winners
   */
  evaluateWinners(
    playerHands: Array<{ userId: string; cards: string[]; status?: SeatStatus }>,
    communityCards: string[]
  ): WinnerInfo[] {
    // Filter out folded players
    const activePlayers = playerHands.filter(
      p => !p.status || p.status === SeatStatus.ACTIVE || p.status === SeatStatus.ALL_IN
    );

    // If only one player remains, they win
    if (activePlayers.length === 1) {
      return [
        {
          userId: activePlayers[0].userId,
          handName: 'Winner by default',
          handCards: activePlayers[0].cards,
        },
      ];
    }

    // Evaluate hands
    const handsToEvaluate = activePlayers.map(player => ({
      userId: player.userId,
      cards: [...player.cards, ...communityCards],
    }));

    const winnerUserIds = this.handEvaluator.findWinners(handsToEvaluate);

    // Get hand details for winners
    return winnerUserIds.map(userId => {
      const player = activePlayers.find(p => p.userId === userId);
      if (!player) throw new Error('Winner not found');

      const evaluation = this.handEvaluator.evaluateHand([
        ...player.cards,
        ...communityCards,
      ]);

      return {
        userId,
        handName: evaluation.handName,
        handCards: evaluation.cards,
      };
    });
  }

  /**
   * Calculates main pot and side pots
   */
  calculatePots(
    contributions: Array<{ userId: string; amount: number }>
  ): Pot[] {
    return this.potService.calculatePots(contributions);
  }

  /**
   * Checks if hand is complete (only one player left or at showdown)
   */
  isHandComplete(
    players: Array<{ status: SeatStatus }>,
    phase: HandPhase
  ): boolean {
    return this.stateMachine.isHandComplete(players, phase);
  }

  /**
   * Checks if current betting round is complete
   */
  isBettingRoundComplete(state: {
    currentBet: number;
    activePlayers: Array<{
      currentBet: number;
      status: SeatStatus;
      hasActed: boolean;
    }>;
  }): boolean {
    return this.stateMachine.isBettingRoundComplete(state);
  }

  // Private helper methods

  private applyAction(
    state: GameState,
    player: PlayerState,
    action: ActionType,
    amount: number
  ): GameState {
    const newState = { ...state };
    const playerIndex = newState.activePlayers.findIndex(
      p => p.userId === player.userId
    );

    if (playerIndex === -1) return state;

    const updatedPlayer = { ...newState.activePlayers[playerIndex] };

    // Update player based on action
    switch (action) {
      case ActionType.FOLD:
        updatedPlayer.status = SeatStatus.FOLDED;
        break;

      case ActionType.CHECK:
        updatedPlayer.hasActed = true;
        break;

      case ActionType.CALL:
        updatedPlayer.chipStack = (updatedPlayer.chipStack || 0) - amount;
        updatedPlayer.currentBet = (updatedPlayer.currentBet || 0) + amount;
        updatedPlayer.hasActed = true;
        break;

      case ActionType.BET:
        updatedPlayer.chipStack = (updatedPlayer.chipStack || 0) - amount;
        updatedPlayer.currentBet = amount;
        updatedPlayer.hasActed = true;
        newState.currentBet = amount;
        newState.minRaise = amount;
        break;

      case ActionType.RAISE:
        const raiseAmount = amount - (updatedPlayer.currentBet || 0);
        updatedPlayer.chipStack = (updatedPlayer.chipStack || 0) - raiseAmount;
        updatedPlayer.currentBet = amount;
        updatedPlayer.hasActed = true;
        newState.minRaise = amount - newState.currentBet;
        newState.currentBet = amount;
        break;

      case ActionType.ALL_IN:
        updatedPlayer.currentBet = (updatedPlayer.currentBet || 0) + amount;
        updatedPlayer.chipStack = 0;
        updatedPlayer.status = SeatStatus.ALL_IN;
        updatedPlayer.hasActed = true;
        if (updatedPlayer.currentBet > newState.currentBet) {
          newState.currentBet = updatedPlayer.currentBet;
        }
        break;
    }

    newState.activePlayers[playerIndex] = updatedPlayer;

    // Advance to next player
    newState.currentPosition = this.stateMachine.getNextPosition(
      player.position,
      newState.activePlayers
    );

    return newState;
  }
}
