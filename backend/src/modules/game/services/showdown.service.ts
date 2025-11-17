import { Injectable } from '@nestjs/common';
import { HandEvaluatorService } from './hand-evaluator.service';
import { SeatStatus } from '../entities/player-seat.entity';

export interface ShowdownPlayer {
  userId: string;
  position: number;
  cards: string[];
  status: SeatStatus;
  wasLastAggressor?: boolean;
  isWinner?: boolean;
}

export interface ShowdownResult {
  winners: Array<{
    userId: string;
    handName: string;
    handCards: string[];
  }>;
  revealOrder: Array<{
    userId: string;
    position: number;
    mustReveal: boolean;
    canMuck: boolean;
  }>;
}

@Injectable()
export class ShowdownService {
  constructor(private readonly handEvaluator: HandEvaluatorService) {}

  /**
   * Determines the order in which players should reveal their cards at showdown
   * @param players - Players at showdown
   * @param dealerPosition - The dealer button position
   * @returns Ordered list of players (last aggressor first, then clockwise from button)
   */
  determineShowdownOrder(
    players: Array<{
      userId: string;
      position: number;
      wasLastAggressor?: boolean;
    }>,
    dealerPosition: number
  ): Array<{ userId: string; position: number }> {
    // Find last aggressor
    const lastAggressor = players.find(p => p.wasLastAggressor);

    // Separate last aggressor from others
    const otherPlayers = players.filter(p => !p.wasLastAggressor);

    // Sort other players clockwise from dealer
    const sortedOthers = this.sortClockwiseFromDealer(otherPlayers, dealerPosition);

    // Last aggressor shows first, then others clockwise
    if (lastAggressor) {
      return [
        { userId: lastAggressor.userId, position: lastAggressor.position },
        ...sortedOthers,
      ];
    }

    // No aggressor (everyone checked) - show clockwise from dealer's left
    return sortedOthers;
  }

  /**
   * Determines if a player can muck their cards (not show)
   * @param player - The player
   * @returns True if player can muck (hide cards)
   */
  allowsMucking(player: {
    isWinner?: boolean;
    status: SeatStatus;
  }): boolean {
    // Winners must show
    if (player.isWinner) {
      return false;
    }

    // All-in players must show
    if (player.status === SeatStatus.ALL_IN) {
      return false;
    }

    // Losing players can muck
    return true;
  }

  /**
   * Determines if a player must reveal their cards
   * @param player - The player
   * @returns True if player must reveal
   */
  requiresCardReveal(player: {
    status: SeatStatus;
    isWinner?: boolean;
  }): boolean {
    // All-in players must always show
    if (player.status === SeatStatus.ALL_IN) {
      return true;
    }

    // Winners must show
    if (player.isWinner) {
      return true;
    }

    // Folded players don't show
    if (player.status === SeatStatus.FOLDED) {
      return false;
    }

    // Others can choose to muck
    return false;
  }

  /**
   * Processes complete showdown: determines winners and reveal order
   * @param players - Players at showdown
   * @param communityCards - Community cards
   * @param dealerPosition - Dealer button position
   * @returns Showdown result with winners and reveal order
   */
  processShowdown(
    players: ShowdownPlayer[],
    communityCards: string[],
    dealerPosition: number
  ): ShowdownResult {
    // Filter only active and all-in players
    const activePlayers = players.filter(
      p => p.status === SeatStatus.ACTIVE || p.status === SeatStatus.ALL_IN
    );

    // Single player wins by default
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      return {
        winners: [
          {
            userId: winner.userId,
            handName: 'Winner by default',
            handCards: winner.cards,
          },
        ],
        revealOrder: [
          {
            userId: winner.userId,
            position: winner.position,
            mustReveal: true,
            canMuck: false,
          },
        ],
      };
    }

    // Evaluate all hands
    const handsToEvaluate = activePlayers.map(player => ({
      userId: player.userId,
      cards: [...player.cards, ...communityCards],
    }));

    const winnerUserIds = this.handEvaluator.findWinners(handsToEvaluate);

    // Mark winners
    const playersWithWinners = activePlayers.map(p => ({
      ...p,
      isWinner: winnerUserIds.includes(p.userId),
    }));

    // Get winner details
    const winners = winnerUserIds.map(userId => {
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

    // Determine reveal order
    const showdownOrder = this.determineShowdownOrder(playersWithWinners, dealerPosition);

    const revealOrder = showdownOrder.map(playerOrder => {
      const player = playersWithWinners.find(p => p.userId === playerOrder.userId);
      if (!player) throw new Error('Player not found in reveal order');

      return {
        userId: player.userId,
        position: player.position,
        mustReveal: this.requiresCardReveal(player),
        canMuck: this.allowsMucking(player),
      };
    });

    return {
      winners,
      revealOrder,
    };
  }

  /**
   * Sorts players clockwise from dealer position
   * Start from dealer's left (dealer + 1)
   */
  private sortClockwiseFromDealer(
    players: Array<{ position: number; userId: string }>,
    dealerPosition: number
  ): Array<{ userId: string; position: number }> {
    const maxPosition = Math.max(...players.map(p => p.position));
    const numSeats = maxPosition + 1;

    return players
      .map(p => ({
        ...p,
        // Calculate distance clockwise from dealer's left
        relativePosition: (p.position - dealerPosition - 1 + numSeats) % numSeats,
      }))
      .sort((a, b) => a.relativePosition - b.relativePosition)
      .map(p => ({ userId: p.userId, position: p.position }));
  }
}
