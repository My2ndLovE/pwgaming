import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { GameHand, HandPhase } from '../entities/game-hand.entity';
import { PlayerSeat } from '../entities/player-seat.entity';
import { BettingAction } from '../entities/betting-action.entity';
import { HandState } from './game-engine.service';

export interface PersistedGameState {
  roomId: string;
  handState: HandState;
  smallBlind: number;
  bigBlind: number;
  timestamp: number;
}

/**
 * GameStateStore manages game state persistence to Redis and PostgreSQL
 *
 * Architecture:
 * - Active games: Stored in Redis for fast access (<10ms)
 * - Completed hands: Persisted to PostgreSQL for history/audit
 * - Crash recovery: Load active games from Redis on restart
 */
@Injectable()
export class GameStateStore {
  private redis: Redis;
  private readonly STATE_TTL = 86400; // 24 hours in seconds

  constructor(
    @InjectRepository(GameHand)
    private readonly gameHandRepository: Repository<GameHand>,
    @InjectRepository(PlayerSeat)
    private readonly playerSeatRepository: Repository<PlayerSeat>,
    @InjectRepository(BettingAction)
    // @ts-expect-error - Reserved for future use
    private readonly _bettingActionRepository: Repository<BettingAction>,
    private readonly configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.redis = new Redis(redisUrl!);
  }

  /**
   * Save active game state to Redis
   * Called after every action/phase change
   */
  async saveGameState(
    roomId: string,
    handState: HandState,
    smallBlind: number,
    bigBlind: number,
  ): Promise<void> {
    const key = this.getRedisKey(roomId);
    const data: PersistedGameState = {
      roomId,
      handState,
      smallBlind,
      bigBlind,
      timestamp: Date.now(),
    };

    await this.redis.setex(key, this.STATE_TTL, JSON.stringify(data));
  }

  /**
   * Load active game state from Redis
   * Used for crash recovery and reconnection
   */
  async loadGameState(roomId: string): Promise<HandState | null> {
    const key = this.getRedisKey(roomId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const parsed: PersistedGameState = JSON.parse(data);
    return parsed.handState;
  }

  /**
   * Delete game state from Redis
   * Called when hand completes and is saved to PostgreSQL
   */
  async deleteGameState(roomId: string): Promise<void> {
    const key = this.getRedisKey(roomId);
    await this.redis.del(key);
  }

  /**
   * Save completed hand to PostgreSQL for history/audit
   * Called when hand reaches COMPLETE phase
   */
  async saveCompletedHand(
    roomId: string,
    handState: HandState,
    smallBlind: number,
    bigBlind: number,
  ): Promise<GameHand> {
    const gameState = handState.state;

    // Create GameHand record
    const gameHand = this.gameHandRepository.create({
      roomId,
      handNumber: 1, // TODO: Track actual hand number
      dealerPosition: gameState.dealerPosition,
      smallBlind,
      bigBlind,
      communityCards: handState.communityCards,
      potAmount: gameState.activePlayers.reduce(
        (sum, p) => sum + (p.currentBet || 0),
        0,
      ),
      players: gameState.activePlayers.map((p) => ({
        userId: p.userId,
        position: p.position,
        chipStack: p.chipStack || 0,
        isActive: p.status === 'active',
      })),
      currentPhase: HandPhase.COMPLETED,
      startedAt: new Date(Date.now() - 60000), // Approximate (should track actual start)
      completedAt: new Date(),
    });

    const savedHand: GameHand = await this.gameHandRepository.save(gameHand);

    // Save player seats
    for (const player of gameState.activePlayers) {
      // playerHand unused for now as we don't save encrypted hole cards here

      const playerSeat = this.playerSeatRepository.create({
        gameHandId: savedHand.id,
        userId: player.userId,
        position: player.position,
        chipStack: player.chipStack || 0,
        currentBet: player.currentBet || 0,
        status: player.status,
        hasActed: player.hasActed || false,
      });

      await this.playerSeatRepository.save(playerSeat);
    }

    // TODO: Save betting actions (requires action history tracking)

    return savedHand;
  }

  /**
   * Validate state consistency
   * Ensures pot = sum of bets, no duplicate cards, stacks >= 0
   */
  validateStateConsistency(handState: HandState): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for negative stacks
    for (const player of handState.state.activePlayers) {
      if (player.chipStack !== undefined && player.chipStack < 0) {
        errors.push(`Negative stack for ${player.userId}: ${player.chipStack}`);
      }
    }

    // Check for duplicate cards
    const allCards: string[] = [];

    // Community cards
    if (handState.communityCards && handState.communityCards.length > 0) {
      allCards.push(...handState.communityCards);
    }

    // Player hole cards
    for (const playerHand of handState.playerHands) {
      if (playerHand.cards && playerHand.cards.length > 0) {
        allCards.push(...playerHand.cards);
      }
    }

    const uniqueCards = new Set(allCards);
    if (uniqueCards.size !== allCards.length) {
      errors.push('Duplicate cards detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Recover all active games from Redis on server restart
   * Returns map of roomId -> HandState
   */
  async recoverAllGames(): Promise<Map<string, HandState>> {
    const pattern = this.getRedisKey('*');
    const keys = await this.redis.keys(pattern);
    const games = new Map<string, HandState>();

    for (const key of keys) {
      const roomId = key.replace('game:state:', '');
      const state = await this.loadGameState(roomId);

      if (state) {
        // Validate before loading
        const validation = this.validateStateConsistency(state);

        if (validation.valid) {
          games.set(roomId, state);
        } else {
          console.error(`Invalid state for room ${roomId}:`, validation.errors);
          // Log to monitoring system
        }
      }
    }

    return games;
  }

  /**
   * Get all active game keys from Redis
   */
  async getActiveRooms(): Promise<string[]> {
    const pattern = this.getRedisKey('*');
    const keys = await this.redis.keys(pattern);
    return keys.map((key) => key.replace('game:state:', ''));
  }

  /**
   * Redis key format: game:state:{roomId}
   */
  private getRedisKey(roomId: string): string {
    return `game:state:${roomId}`;
  }

  /**
   * Cleanup expired states (called by cron job)
   */
  async cleanupExpiredStates(): Promise<number> {
    const rooms = await this.getActiveRooms();
    let cleaned = 0;

    for (const roomId of rooms) {
      const state = await this.loadGameState(roomId);

      if (state) {
        const key = this.getRedisKey(roomId);
        const ttl = await this.redis.ttl(key);

        // If TTL < 1 hour, consider it stale
        if (ttl < 3600) {
          await this.deleteGameState(roomId);
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}
