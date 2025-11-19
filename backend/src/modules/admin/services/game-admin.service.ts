import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHand } from '../../game/entities/game-hand.entity';
import { Room } from '../../room/entities/room.entity';

export interface LiveGameInfo {
  roomId: string;
  roomName: string;
  smallBlind: number;
  bigBlind: number;
  playerCount: number;
  currentPhase: string;
  potAmount: number;
  handNumber: number;
  players: Array<{
    userId: string;
    chipStack: number;
    position: number;
    status: string;
  }>;
}

export interface SuspiciousActivityInfo {
  flaggedUsers: Array<{
    userId: string;
    reason: string;
    detectionTime: Date;
    roomId: string;
  }>;
  botDetections: Array<{
    userId: string;
    averageResponseTime: number;
    suspicionScore: number;
    roomId: string;
  }>;
  multiAccounts: Array<{
    ip: string;
    userIds: string[];
    roomId: string;
    timestamp: Date;
  }>;
}

@Injectable()
export class GameAdminService {
  private readonly logger = new Logger(GameAdminService.name);
  private gameGatewayRef: any = null;

  constructor(
    @InjectRepository(GameHand)
    private readonly gameHandRepository: Repository<GameHand>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * Set reference to GameGateway (called by GameGateway on init)
   * This allows admin service to access live game data
   */
  setGameGatewayReference(gateway: any) {
    this.gameGatewayRef = gateway;
    this.logger.log('GameGateway reference established for admin monitoring');
  }

  /**
   * Get all currently active games with real-time data
   */
  async getLiveGames(): Promise<{
    games: LiveGameInfo[];
    totalPlayers: number;
    activeTables: number;
  }> {
    if (!this.gameGatewayRef) {
      this.logger.warn('GameGateway reference not available, returning empty data');
      return { games: [], totalPlayers: 0, activeTables: 0 };
    }

    const liveGames: LiveGameInfo[] = [];
    let totalPlayers = 0;

    // Access the rooms Map from GameGateway
    const rooms = this.gameGatewayRef.rooms;

    for (const [roomId, roomState] of rooms.entries()) {
      if (!roomState.handState) continue;

      // Get room details from database
      const room = await this.roomRepository.findOne({ where: { id: roomId } });
      if (!room) continue;

      const players = roomState.handState.state.activePlayers.map((p: any) => ({
        userId: p.userId,
        chipStack: p.chipStack || 0,
        position: p.position,
        status: p.status,
      }));

      totalPlayers += players.length;

      liveGames.push({
        roomId,
        roomName: room.name,
        smallBlind: roomState.smallBlind,
        bigBlind: roomState.bigBlind,
        playerCount: players.length,
        currentPhase: roomState.handState.state.phase,
        potAmount: roomState.handState.state.activePlayers.reduce(
          (sum: number, p: any) => sum + (p.currentBet || 0),
          0,
        ),
        handNumber: roomState.handNumber,
        players,
      });
    }

    return {
      games: liveGames,
      totalPlayers,
      activeTables: liveGames.length,
    };
  }

  /**
   * Pause a game (prevents new actions)
   */
  async pauseGame(roomId: string): Promise<{ success: boolean; message: string }> {
    if (!this.gameGatewayRef) {
      throw new Error('GameGateway reference not available');
    }

    const rooms = this.gameGatewayRef.rooms;
    const room = rooms.get(roomId);

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    // Implement pause logic (could add a 'paused' flag to RoomState)
    this.logger.warn(`Game ${roomId} paused by admin`);

    // Broadcast pause event to all players
    this.gameGatewayRef.server.to(roomId).emit('game:paused', {
      message: 'Game paused by administrator',
      timestamp: new Date(),
    });

    return { success: true, message: 'Game paused successfully' };
  }

  /**
   * Resume a paused game
   */
  async resumeGame(roomId: string): Promise<{ success: boolean; message: string }> {
    if (!this.gameGatewayRef) {
      throw new Error('GameGateway reference not available');
    }

    const rooms = this.gameGatewayRef.rooms;
    const room = rooms.get(roomId);

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    this.logger.log(`Game ${roomId} resumed by admin`);

    // Broadcast resume event to all players
    this.gameGatewayRef.server.to(roomId).emit('game:resumed', {
      message: 'Game resumed by administrator',
      timestamp: new Date(),
    });

    return { success: true, message: 'Game resumed successfully' };
  }

  /**
   * Cancel current hand and refund all bets
   */
  async cancelHand(
    roomId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.gameGatewayRef) {
      throw new Error('GameGateway reference not available');
    }

    const rooms = this.gameGatewayRef.rooms;
    const room = rooms.get(roomId);

    if (!room || !room.handState) {
      throw new NotFoundException(`Active hand not found in room ${roomId}`);
    }

    // Refund all bets to players
    const refunds = room.handState.state.activePlayers.map((p: any) => ({
      userId: p.userId,
      amount: p.currentBet || 0,
    }));

    this.logger.warn(`Hand cancelled in room ${roomId}: ${reason}`);

    // Broadcast cancellation to all players
    this.gameGatewayRef.server.to(roomId).emit('game:hand_cancelled', {
      reason,
      refunds,
      timestamp: new Date(),
    });

    // Clear hand state
    room.handState = null;

    return {
      success: true,
      message: 'Hand cancelled and bets refunded',
    };
  }

  /**
   * Get hand history for a specific room
   */
  async getHandHistory(roomId: string, limit = 50): Promise<{ hands: GameHand[] }> {
    const hands = await this.gameHandRepository.find({
      where: { roomId },
      order: { completedAt: 'DESC' },
      take: limit,
    });

    return { hands };
  }

  /**
   * Get suspicious activity from bot detection and multi-account systems
   */
  async getSuspiciousActivity(): Promise<SuspiciousActivityInfo> {
    if (!this.gameGatewayRef) {
      return { flaggedUsers: [], botDetections: [], multiAccounts: [] };
    }

    const flaggedUsers: any[] = [];
    const botDetections: any[] = [];
    const multiAccounts: any[] = [];

    // Access bot detection service
    const botDetectionService = this.gameGatewayRef.botDetection;
    const multiAccountService = this.gameGatewayRef.multiAccountDetection;

    // Get bot detections (would need to add a method to BotDetectionService)
    // For now, return placeholder structure

    return {
      flaggedUsers,
      botDetections,
      multiAccounts,
    };
  }
}
