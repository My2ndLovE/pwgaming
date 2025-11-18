import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHand } from '../../game/entities/game-hand.entity';
import { PlayerSeat } from '../../game/entities/player-seat.entity';
import { BettingAction } from '../../game/entities/betting-action.entity';
import { DeckService } from '../../game/services/deck.service';

export interface ReplayStep {
  step: number;
  phase: string;
  action?: {
    playerId: string;
    playerName?: string;
    type: string;
    amount?: number;
    timestamp: Date;
  };
  gameState: {
    pot: number;
    communityCards: string[];
    activePlayers: Array<{
      userId: string;
      position: number;
      chipStack: number;
      currentBet: number;
      status: string;
    }>;
  };
  description: string;
}

export interface HandReplayData {
  handId: string;
  handNumber: number;
  startedAt: Date;
  completedAt: Date | null;
  smallBlind: number;
  bigBlind: number;
  dealerPosition: number;
  shuffleSeed: string | null;
  players: PlayerSeat[];
  actions: BettingAction[];
  communityCards: string[] | null;
  potAmount: number;
  winners: any;
  replaySteps: ReplayStep[];
  canReplay: boolean;
}

@Injectable()
export class HandReplayService {
  constructor(
    @InjectRepository(GameHand)
    private readonly gameHandRepository: Repository<GameHand>,
    @InjectRepository(PlayerSeat)
    private readonly playerSeatRepository: Repository<PlayerSeat>,
    @InjectRepository(BettingAction)
    private readonly bettingActionRepository: Repository<BettingAction>,
    private readonly deckService: DeckService,
  ) {}

  /**
   * Get complete hand replay data
   */
  async getHandReplay(handId: string): Promise<HandReplayData> {
    // Fetch hand data
    const hand = await this.gameHandRepository.findOne({
      where: { id: handId },
      relations: ['room'],
    });

    if (!hand) {
      throw new NotFoundException(`Hand ${handId} not found`);
    }

    // Fetch player seats
    const players = await this.playerSeatRepository.find({
      where: { handId },
      order: { position: 'ASC' },
    });

    // Fetch all actions
    const actions = await this.bettingActionRepository.find({
      where: { handId },
      order: { sequenceNumber: 'ASC' },
    });

    // Generate replay steps
    const replaySteps = this.generateReplaySteps(hand, players, actions);

    return {
      handId: hand.id,
      handNumber: hand.handNumber,
      startedAt: hand.startedAt,
      completedAt: hand.completedAt,
      smallBlind: hand.smallBlind,
      bigBlind: hand.bigBlind,
      dealerPosition: hand.dealerPosition,
      shuffleSeed: hand.shuffleSeed,
      players,
      actions,
      communityCards: hand.communityCards,
      potAmount: hand.potAmount,
      winners: hand.winners,
      replaySteps,
      canReplay: !!hand.shuffleSeed,
    };
  }

  /**
   * Reconstruct exact deck shuffle using seed
   */
  async reconstructDeck(handId: string): Promise<string[]> {
    const hand = await this.gameHandRepository.findOne({
      where: { id: handId },
    });

    if (!hand) {
      throw new NotFoundException(`Hand ${handId} not found`);
    }

    if (!hand.shuffleSeed) {
      throw new Error('Cannot reconstruct deck: No shuffle seed available');
    }

    // Recreate deck with same seed
    const deck = this.deckService.createDeck();
    const { deck: shuffledDeck } = this.deckService.shuffleWithSeed(
      deck,
      hand.shuffleSeed,
    );

    return shuffledDeck;
  }

  /**
   * Generate step-by-step replay
   */
  private generateReplaySteps(
    hand: GameHand,
    players: PlayerSeat[],
    actions: BettingAction[],
  ): ReplayStep[] {
    const steps: ReplayStep[] = [];
    let stepNumber = 0;
    let currentPot = 0;
    const playerStacks = new Map<string, number>();
    const playerBets = new Map<string, number>();

    // Initialize player stacks
    players.forEach((player) => {
      playerStacks.set(player.userId, player.initialChipStack);
      playerBets.set(player.userId, 0);
    });

    // Step 1: Hand start
    steps.push({
      step: stepNumber++,
      phase: 'PREFLOP',
      gameState: {
        pot: 0,
        communityCards: [],
        activePlayers: players.map((p) => ({
          userId: p.userId,
          position: p.position,
          chipStack: p.initialChipStack,
          currentBet: 0,
          status: 'active',
        })),
      },
      description: `Hand #${hand.handNumber} started`,
    });

    // Step 2: Blinds posted
    currentPot = hand.smallBlind + hand.bigBlind;
    steps.push({
      step: stepNumber++,
      phase: 'PREFLOP',
      gameState: {
        pot: currentPot,
        communityCards: [],
        activePlayers: players.map((p) => ({
          userId: p.userId,
          position: p.position,
          chipStack: p.initialChipStack,
          currentBet: 0,
          status: 'active',
        })),
      },
      description: `Blinds posted: SB ${hand.smallBlind}, BB ${hand.bigBlind}`,
    });

    // Process each action
    let currentPhase = 'PREFLOP';
    let communityCards: string[] = [];

    actions.forEach((action, index) => {
      // Check for phase change
      if (action.phase !== currentPhase) {
        currentPhase = action.phase;

        // Add community cards based on phase
        if (currentPhase === 'FLOP' && hand.communityCards) {
          communityCards = hand.communityCards.slice(0, 3);
        } else if (currentPhase === 'TURN' && hand.communityCards) {
          communityCards = hand.communityCards.slice(0, 4);
        } else if (currentPhase === 'RIVER' && hand.communityCards) {
          communityCards = hand.communityCards.slice(0, 5);
        }

        steps.push({
          step: stepNumber++,
          phase: currentPhase,
          gameState: {
            pot: currentPot,
            communityCards,
            activePlayers: Array.from(playerStacks.entries()).map(
              ([userId, chipStack]) => ({
                userId,
                position:
                  players.find((p) => p.userId === userId)?.position || 0,
                chipStack,
                currentBet: playerBets.get(userId) || 0,
                status: 'active',
              }),
            ),
          },
          description: `${currentPhase} begins`,
        });
      }

      // Update stacks and pot based on action
      if (action.amount) {
        const currentStack = playerStacks.get(action.playerId) || 0;
        playerStacks.set(action.playerId, currentStack - action.amount);
        playerBets.set(
          action.playerId,
          (playerBets.get(action.playerId) || 0) + action.amount,
        );
        currentPot += action.amount;
      }

      // Add action step
      steps.push({
        step: stepNumber++,
        phase: currentPhase,
        action: {
          playerId: action.playerId,
          type: action.actionType,
          amount: action.amount,
          timestamp: action.createdAt,
        },
        gameState: {
          pot: currentPot,
          communityCards,
          activePlayers: Array.from(playerStacks.entries()).map(
            ([userId, chipStack]) => ({
              userId,
              position: players.find((p) => p.userId === userId)?.position || 0,
              chipStack,
              currentBet: playerBets.get(userId) || 0,
              status: 'active',
            }),
          ),
        },
        description: `${action.actionType.toUpperCase()}${action.amount ? ` ${action.amount}` : ''}`,
      });
    });

    // Final step: Winners
    if (hand.winners && hand.winners.length > 0) {
      steps.push({
        step: stepNumber++,
        phase: 'SHOWDOWN',
        gameState: {
          pot: hand.potAmount,
          communityCards: hand.communityCards || [],
          activePlayers: Array.from(playerStacks.entries()).map(
            ([userId, chipStack]) => ({
              userId,
              position: players.find((p) => p.userId === userId)?.position || 0,
              chipStack,
              currentBet: 0,
              status: 'active',
            }),
          ),
        },
        description: `Winners: ${hand.winners.map((w) => `${w.userId} wins ${w.amount}`).join(', ')}`,
      });
    }

    return steps;
  }

  /**
   * Verify hand replay accuracy
   */
  async verifyReplayAccuracy(handId: string): Promise<boolean> {
    try {
      const hand = await this.gameHandRepository.findOne({
        where: { id: handId },
      });

      if (!hand || !hand.shuffleSeed) {
        return false;
      }

      // Reconstruct deck
      const reconstructedDeck = await this.reconstructDeck(handId);

      // Fetch player seats to verify dealt cards
      const players = await this.playerSeatRepository.find({
        where: { handId },
        order: { position: 'ASC' },
      });

      // Deal cards from reconstructed deck
      let deckIndex = 0;
      for (const player of players) {
        const dealtCards = reconstructedDeck.slice(deckIndex, deckIndex + 2);
        deckIndex += 2;

        // Compare with stored hole cards
        if (
          JSON.stringify(dealtCards.sort()) !==
          JSON.stringify(player.holeCards?.sort())
        ) {
          return false;
        }
      }

      // Verify community cards if available
      if (hand.communityCards) {
        // Account for burn cards (1 before flop, 1 before turn, 1 before river)
        const burnAndFlop = reconstructedDeck.slice(deckIndex, deckIndex + 4); // 1 burn + 3 flop
        const expectedFlop = burnAndFlop.slice(1); // Skip burn card

        if (
          JSON.stringify(expectedFlop.sort()) !==
          JSON.stringify(hand.communityCards.slice(0, 3).sort())
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error verifying replay accuracy:', error);
      return false;
    }
  }
}
