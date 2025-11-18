import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsAuthGuard } from '../../realtime/guards/ws-auth.guard';
import { GameEngine, HandState } from '../services/game-engine.service';
import { TimeoutService } from '../services/timeout.service';
import { ActionType } from '../entities/betting-action.entity';
import { HandPhase } from '../entities/game-hand.entity';
import { GameWalletService } from '../../wallet/services/game-wallet.service';
import { GameStateStore } from '../services/game-state-store.service';
import { BotDetectionService } from '../services/bot-detection.service';
import { MultiAccountDetectionService } from '../services/multi-account-detection.service';
import { RoomService } from '../../room/services/room.service';
import {
  JoinGameDto,
  GameActionDto,
  LeaveGameDto,
  RebuyDto,
} from '../dto/game-events.dto';

interface RoomState {
  roomId: string;
  handState: HandState | null;
  smallBlind: number;
  bigBlind: number;
  actionTimeoutSeconds: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  perMessageDeflate: {
    threshold: 1024, // Compress messages > 1KB
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3, // Balanced compression
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
  },
})
@UseGuards(WsAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private rooms: Map<string, RoomState> = new Map();
  private connectedPlayers: Map<
    string,
    { socket: Socket; roomId: string; chipStack?: number }
  > = new Map();
  private reconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private actionLocks: Map<string, boolean> = new Map(); // roomId -> isLocked
  private actionTimestamps: Map<string, number> = new Map(); // userId -> last action prompt timestamp

  constructor(
    private readonly gameEngine: GameEngine,
    private readonly timeoutService: TimeoutService,
    private readonly gameWalletService: GameWalletService,
    private readonly gameStateStore: GameStateStore,
    private readonly botDetection: BotDetectionService,
    private readonly multiAccountDetection: MultiAccountDetectionService,
    private readonly roomService: RoomService,
  ) {
    // Recover active games on startup
    this.recoverActiveGames();
  }

  /**
   * Recover all active games from Redis on server restart
   */
  private async recoverActiveGames() {
    try {
      const recoveredGames = await this.gameStateStore.recoverAllGames();

      for (const [roomId, handState] of recoveredGames) {
        // Load room configuration from database
        const room = await this.roomService.getRoomById(roomId);
        if (!room) {
          console.error(`Room ${roomId} not found during recovery, skipping`);
          continue;
        }

        this.rooms.set(roomId, {
          roomId,
          handState,
          smallBlind: room.smallBlind,
          bigBlind: room.bigBlind,
          actionTimeoutSeconds: 30,
        });

        console.log(
          `Recovered game for room ${roomId} (${room.smallBlind}/${room.bigBlind})`,
        );
      }

      console.log(
        `Crash recovery complete: ${recoveredGames.size} games restored`,
      );
    } catch (error) {
      console.error('Failed to recover games:', error);
    }
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.userId;
    if (userId) {
      console.log(`User ${userId} connected (socket: ${client.id})`);

      // Handle reconnection
      if (this.connectedPlayers.has(userId)) {
        const existing = this.connectedPlayers.get(userId)!;
        if (existing.socket.id !== client.id) {
          console.log(`User ${userId} reconnected from different socket`);
          this.handleReconnection(userId, client);
        }
      }
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    console.log(`User ${userId} disconnected (socket: ${client.id})`);

    const playerInfo = this.connectedPlayers.get(userId);
    if (!playerInfo) return;

    const { roomId } = playerInfo;

    // Notify other players of disconnection
    this.server.to(roomId).emit('game:player_disconnected', {
      userId,
      message: `Player disconnected (60 second grace period)`,
      graceTimeRemaining: 60,
    });

    // Start 60-second grace period for reconnection
    const timer = setTimeout(() => {
      this.handlePlayerTimeout(userId, roomId);
    }, 60000);

    this.reconnectionTimers.set(userId, timer);

    console.log(`Started 60s reconnection timer for user ${userId}`);
  }

  @SubscribeMessage('game:join')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinGameDto,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId, buyIn } = data;

    // SECURITY: Multi-account detection
    const clientIP =
      client.handshake.address || client.conn.remoteAddress || 'unknown';
    const isFlagged = this.multiAccountDetection.trackPlayerJoin(
      userId,
      roomId,
      clientIP,
    );

    if (isFlagged) {
      console.warn(
        `SECURITY: Multiple accounts detected from IP ${clientIP} in room ${roomId}`,
      );
      // Continue but log for admin review (don't block, could be same household)
    }

    // Initialize room state if needed
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        handState: null,
        smallBlind: 50,
        bigBlind: 100,
        actionTimeoutSeconds: 30,
      });
    }

    const room = this.rooms.get(roomId)!;

    // WALLET INTEGRATION: Validate and process buy-in
    const validation = await this.gameWalletService.validateBuyIn({
      userId,
      roomId,
      buyInAmount: buyIn,
      bigBlind: room.bigBlind,
    });

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      // Process buy-in atomically (deduct from wallet)
      await this.gameWalletService.processBuyIn({
        userId,
        roomId,
        buyInAmount: buyIn,
        bigBlind: room.bigBlind,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Buy-in failed';
      return { success: false, error: message };
    }

    // Join Socket.IO room
    client.join(roomId);

    // Track connected player with chip stack
    this.connectedPlayers.set(userId, {
      socket: client,
      roomId,
      chipStack: buyIn,
    });

    // Clear any reconnection timer
    if (this.reconnectionTimers.has(userId)) {
      clearTimeout(this.reconnectionTimers.get(userId));
      this.reconnectionTimers.delete(userId);
    }

    // Initialize hand if first players joining
    if (!room.handState) {
      const players = [{ userId, chipStack: buyIn, position: 0 }];
      room.handState = this.gameEngine.startNewHand(
        players,
        0,
        room.smallBlind,
        room.bigBlind,
      );

      this.broadcastGameState(roomId);
      this.sendPrivateCards(roomId);
    } else {
      // Add player to existing game (between hands)
      // This would require GameEngine support for dynamic player addition
      // For now, just send current state
      this.sendGameState(client, roomId);
    }

    return { success: true, buyIn };
  }

  @SubscribeMessage('game:action')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handlePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GameActionDto,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId, action, amount } = data;
    const room = this.rooms.get(roomId);

    if (!room || !room.handState) {
      return { success: false, error: 'Game not found' };
    }

    // SECURITY: Action locking to prevent race conditions
    if (this.actionLocks.get(roomId)) {
      return { success: false, error: 'Action already being processed' };
    }

    this.actionLocks.set(roomId, true);

    try {
      // SECURITY: Bot detection - measure response time
      const promptTimestamp = this.actionTimestamps.get(userId);
      if (promptTimestamp) {
        const responseTime = Date.now() - promptTimestamp;
        this.botDetection.recordAction(userId, responseTime);

        if (this.botDetection.isSuspicious(userId)) {
          console.warn(
            `SECURITY: Bot-like behavior detected for user ${userId}`,
          );
          // Continue but log for admin review
        }
      }

      // Clear action timer for this player
      const handId = `${roomId}-hand-${room.handState.state.phase}`;
      this.timeoutService.clearActionTimer(handId, userId);

      // SECURITY: Validate action through GameEngine (already validates turn, chips, etc.)
      const result = this.gameEngine.processAction(
        room.handState,
        userId,
        action,
        amount,
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return await this.processSuccessfulAction(
        roomId,
        userId,
        action,
        amount,
        room,
      );
    } finally {
      // Always release lock
      this.actionLocks.set(roomId, false);
    }
  }

  private async processSuccessfulAction(
    roomId: string,
    userId: string,
    action: ActionType,
    amount: number,
    room: RoomState,
  ) {
    // Broadcast action to all players
    this.server.to(roomId).emit('game:player_action', {
      userId,
      action,
      amount,
      timestamp: new Date(),
    });

    // Check if betting round is complete
    if (
      room.handState &&
      this.gameEngine.isBettingRoundComplete(room.handState.state)
    ) {
      // Check if hand is complete
      if (
        this.gameEngine.isHandComplete(
          room.handState.state.activePlayers,
          room.handState.state.phase,
        )
      ) {
        this.handleHandComplete(roomId);
      } else {
        // Advance to next phase
        this.handleAdvancePhase(roomId);
      }
    } else if (room.handState) {
      // Start timer for next player
      const currentPlayer = room.handState.state.activePlayers.find(
        (p) => p.position === room.handState!.state.currentPosition,
      );
      if (currentPlayer) {
        this.startActionTimer(roomId, currentPlayer.userId);
      }
    }

    // Broadcast updated state
    await this.broadcastGameState(roomId);

    return {
      success: true,
      state: this.sanitizeState(room.handState!, userId),
    };
  }

  @SubscribeMessage('game:leave')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveGameDto,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId } = data;
    const room = this.rooms.get(roomId);

    // WALLET INTEGRATION: Cash-out player's chips
    if (room?.handState) {
      const player = room.handState.playerHands.find(
        (p) => p.userId === userId,
      );
      if (player) {
        try {
          const playerState = room.handState.state.activePlayers.find(
            (p) => p.userId === userId,
          );
          await this.gameWalletService.processCashOut({
            userId,
            roomId,
            chipStack: playerState?.chipStack || 0,
          });
        } catch (error) {
          console.error('Cash-out failed:', error);
          // Continue with leave process even if cash-out fails
          // Admin can manually correct balance later
        }
      }
    }

    client.leave(roomId);
    this.connectedPlayers.delete(userId);

    // TODO: Remove player from active hand if mid-hand
    // TODO: Redistribute chips if player was all-in

    return { success: true };
  }

  @SubscribeMessage('game:rebuy')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleRebuy(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RebuyDto,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId, amount } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Validate player is NOT in active hand
    if (room.handState) {
      const player = room.handState.playerHands.find(
        (p) => p.userId === userId,
      );
      if (player && room.handState.state.phase !== HandPhase.COMPLETED) {
        return { success: false, error: 'Cannot rebuy during active hand' };
      }
    }

    // WALLET INTEGRATION: Process rebuy
    try {
      await this.gameWalletService.processRebuy({
        userId,
        roomId,
        rebuyAmount: amount,
        bigBlind: room.bigBlind,
      });

      // Add chips to player's stack
      if (room.handState) {
        const playerState = room.handState.state.activePlayers.find(
          (p) => p.userId === userId,
        );
        if (playerState && playerState.chipStack !== undefined) {
          playerState.chipStack += amount;
          this.broadcastGameState(roomId);
        }
      }

      return { success: true, newStack: amount };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Rebuy failed';
      return { success: false, error: errorMessage };
    }
  }

  // Private helper methods

  private handleReconnection(userId: string, newSocket: Socket) {
    const existing = this.connectedPlayers.get(userId)!;
    const { roomId } = existing;
    const room = this.rooms.get(roomId);

    console.log(`Reconnecting user ${userId} to room ${roomId}`);

    // Clear reconnection timer
    if (this.reconnectionTimers.has(userId)) {
      clearTimeout(this.reconnectionTimers.get(userId));
      this.reconnectionTimers.delete(userId);
    }

    // Update socket reference
    this.connectedPlayers.set(userId, { socket: newSocket, roomId });
    newSocket.join(roomId);

    // FULL STATE RESTORATION
    if (room && room.handState) {
      // 1. Send current game state (sanitized for player)
      const sanitizedState = this.sanitizeState(room.handState, userId);
      newSocket.emit('game:state', sanitizedState);

      // 2. Send player's private hole cards
      const playerHand = room.handState.playerHands.find(
        (h) => h.userId === userId,
      );
      if (playerHand && playerHand.cards) {
        newSocket.emit('game:your_cards', { cards: playerHand.cards });
      }

      // 3. Restore action timer if it's player's turn
      const currentPlayer = room.handState.state.activePlayers.find(
        (p) => p.position === room.handState!.state.currentPosition,
      );

      if (currentPlayer && currentPlayer.userId === userId) {
        const handId = `${roomId}-hand-${room.handState.state.phase}`;
        const remainingTime = this.timeoutService.getRemainingTime(
          handId,
          userId,
        );

        if (remainingTime > 0) {
          newSocket.emit('game:your_turn', {
            timeRemaining: remainingTime,
            validActions: this.getValidActions(room.handState, userId),
          });
        }
      }

      // 4. Send action history (if available)
      // TODO: Track action history in HandState for full replay
    }

    // Notify other players of reconnection
    this.server.to(roomId).emit('game:player_reconnected', {
      userId,
      message: `Player reconnected`,
    });

    console.log(`User ${userId} successfully reconnected to room ${roomId}`);
  }

  private handlePlayerTimeout(userId: string, roomId: string) {
    console.log(`Player ${userId} timed out in room ${roomId}`);

    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // Auto-fold if it's their turn
    const currentPlayer = room.handState.state.activePlayers.find(
      (p) => p.position === room.handState!.state.currentPosition,
    );

    if (currentPlayer && currentPlayer.userId === userId) {
      this.gameEngine.processAction(room.handState, userId, ActionType.FOLD, 0);

      this.broadcastGameState(roomId);

      // Continue game
      if (
        this.gameEngine.isHandComplete(
          room.handState.state.activePlayers,
          room.handState.state.phase,
        )
      ) {
        this.handleHandComplete(roomId);
      }
    }

    this.connectedPlayers.delete(userId);
    this.reconnectionTimers.delete(userId);
  }

  private handleAdvancePhase(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // Advance phase
    this.gameEngine.advanceToNextPhase(room.handState);

    // Broadcast phase change
    this.server.to(roomId).emit('game:phase_advanced', {
      phase: room.handState.state.phase,
      communityCards: room.handState.communityCards,
    });

    // Start timer for first player in new phase
    const firstPlayer = room.handState.state.activePlayers.find(
      (p) => p.position === room.handState!.state.currentPosition,
    );
    if (firstPlayer) {
      this.startActionTimer(roomId, firstPlayer.userId);
    }

    this.broadcastGameState(roomId);
  }

  private async handleHandComplete(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // Evaluate winners
    const winners = this.gameEngine.evaluateWinners(
      room.handState.playerHands,
      room.handState.communityCards,
    );

    // Calculate pots
    const contributions = room.handState.state.activePlayers.map((p) => ({
      userId: p.userId,
      amount: p.currentBet || 0,
    }));
    const pots = this.gameEngine.calculatePots(contributions);

    // Broadcast hand complete
    this.server.to(roomId).emit('game:hand_complete', {
      winners,
      pots,
    });

    // PERSISTENCE: Save completed hand to PostgreSQL
    try {
      await this.gameStateStore.saveCompletedHand(
        roomId,
        room.handState,
        room.smallBlind,
        room.bigBlind,
      );

      // Delete from Redis (no longer active)
      await this.gameStateStore.deleteGameState(roomId);
    } catch (error) {
      console.error('Failed to save completed hand:', error);
    }

    // Clear all action timers
    const handId = `${roomId}-hand-${room.handState.state.phase}`;
    this.timeoutService.clearAllTimersForHand(handId);

    // Update chip stacks based on hand results
    this.updateChipStacks(roomId, room.handState, winners, pots);

    // Start new hand after 5 seconds
    setTimeout(() => {
      this.startNewHand(roomId);
    }, 5000);
  }

  private startNewHand(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const connectedPlayers = Array.from(this.connectedPlayers.values())
      .filter((p) => p.roomId === roomId)
      .map((p, idx) => ({
        userId: p.socket.data.user?.userId,
        chipStack: p.chipStack, // Use tracked chip stack
        position: idx,
      }));

    if (connectedPlayers.length < 2) {
      return; // Need at least 2 players
    }

    // Start new hand
    const dealerPosition = room.handState
      ? this.gameEngine['stateMachine'].calculateNextDealer(
          room.handState.state.dealerPosition,
          connectedPlayers,
        )
      : 0;

    room.handState = this.gameEngine.startNewHand(
      connectedPlayers.filter((p) => p.chipStack !== undefined) as Array<{
        userId: string;
        chipStack: number;
        position: number;
      }>,
      dealerPosition,
      room.smallBlind,
      room.bigBlind,
    );

    // Broadcast hand started
    this.server.to(roomId).emit('game:hand_started', {
      dealerPosition,
    });

    // Send private cards
    this.sendPrivateCards(roomId);

    // Broadcast public state
    this.broadcastGameState(roomId);

    // Start action timer for first player
    const firstPlayer = room.handState.state.activePlayers.find(
      (p) => p.position === room.handState!.state.currentPosition,
    );
    if (firstPlayer) {
      this.startActionTimer(roomId, firstPlayer.userId);
    }
  }

  /**
   * Update chip stacks after a hand completes
   * Distributes pots to winners and updates player chip stacks
   */
  private updateChipStacks(
    roomId: string,
    handState: HandState,
    winners: any[],
    pots: any[],
  ) {
    // Build a map of userId -> net change (winnings - bets)
    const chipChanges = new Map<string, number>();

    // First, deduct all bets from players
    handState.state.activePlayers.forEach((player) => {
      const totalBet = player.currentBet || 0;
      chipChanges.set(player.userId, -totalBet);
    });

    // Then, add winnings from pots
    pots.forEach((pot, _potIndex) => {
      const potWinners = winners.filter((winner) =>
        pot.eligiblePlayers.includes(winner.userId),
      );

      if (potWinners.length > 0) {
        const sharePerWinner = pot.amount / potWinners.length;
        potWinners.forEach((winner) => {
          const current = chipChanges.get(winner.userId) || 0;
          chipChanges.set(winner.userId, current + sharePerWinner);
        });
      }
    });

    // Update connected players' chip stacks
    chipChanges.forEach((change, userId) => {
      const player = this.connectedPlayers.get(userId);
      if (player && player.roomId === roomId) {
        if (player.chipStack !== undefined) {
          player.chipStack = Math.max(0, player.chipStack + change);
        }

        // Log for debugging
        console.log(
          `Player ${userId} chip stack updated: ${change > 0 ? '+' : ''}${change.toFixed(2)} -> ${(player.chipStack || 0).toFixed(2)}`,
        );

        // If player is busted (0 chips), they should be removed or allowed to rebuy
        if (player.chipStack === 0) {
          console.log(`Player ${userId} busted in room ${roomId}`);
          // Note: Player removal/rebuy logic can be added here if needed
        }
      }
    });
  }

  private startActionTimer(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // SECURITY: Record timestamp for bot detection
    this.actionTimestamps.set(userId, Date.now());

    const handId = `${roomId}-hand-${room.handState.state.phase}`;

    this.timeoutService.startActionTimer(
      handId,
      userId,
      room.actionTimeoutSeconds,
      (_, playerId) => {
        // Auto-fold on timeout
        if (room.handState) {
          this.gameEngine.processAction(
            room.handState,
            playerId,
            ActionType.FOLD,
            0,
          );

          this.server
            .to(roomId)
            .emit('game:player_timeout', { userId: playerId });
          this.broadcastGameState(roomId);
        }
      },
    );

    // Broadcast timer started
    this.server.to(roomId).emit('game:timer_started', {
      userId,
      seconds: room.actionTimeoutSeconds,
    });
  }

  private async broadcastGameState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // PERSISTENCE: Save state to Redis after every update
    try {
      await this.gameStateStore.saveGameState(
        roomId,
        room.handState,
        room.smallBlind,
        room.bigBlind,
      );
    } catch (error) {
      console.error('Failed to save game state:', error);
    }

    // Send sanitized state to each player
    this.connectedPlayers.forEach((playerInfo, userId) => {
      if (playerInfo.roomId === roomId) {
        const sanitized = this.sanitizeState(room.handState!, userId);
        playerInfo.socket.emit('game:state', sanitized);
      }
    });
  }

  private sendGameState(socket: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    const userId = socket.data.user?.userId;

    if (!room || !room.handState || !userId) return;

    const sanitized = this.sanitizeState(room.handState, userId);
    socket.emit('game:state', sanitized);
  }

  private sendPrivateCards(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    room.handState.playerHands.forEach((hand) => {
      const playerInfo = this.connectedPlayers.get(hand.userId);
      if (playerInfo) {
        playerInfo.socket.emit('game:your_cards', {
          cards: hand.cards,
        });
      }
    });
  }

  /**
   * Get valid actions for a player
   */
  private getValidActions(handState: HandState, userId: string): string[] {
    const player = handState.state.activePlayers.find(
      (p) => p.userId === userId,
    );
    if (!player) return [];

    const actions: string[] = [];
    const currentBet = handState.state.currentBet || 0;

    // Can always fold
    actions.push('fold');

    // Check if can check
    if (player.currentBet === currentBet) {
      actions.push('check');
    } else {
      // Must call to stay in
      actions.push('call');
    }

    // Can raise if has enough chips
    const callAmount = currentBet - (player.currentBet || 0);
    const minRaise = handState.state.minRaise || handState.state.currentBet;

    if (
      player.chipStack !== undefined &&
      player.chipStack > callAmount + minRaise
    ) {
      actions.push('raise');
    }

    // Can always go all-in
    if (player.chipStack !== undefined && player.chipStack > 0) {
      actions.push('all-in');
    }

    return actions;
  }

  private sanitizeState(handState: HandState, viewerUserId: string): any {
    return {
      phase: handState.state.phase,
      dealerPosition: handState.state.dealerPosition,
      currentPosition: handState.state.currentPosition,
      currentBet: handState.state.currentBet,
      minRaise: handState.state.minRaise,
      communityCards: handState.communityCards,
      players: handState.state.activePlayers.map((p) => ({
        userId: p.userId,
        position: p.position,
        chipStack: p.chipStack,
        currentBet: p.currentBet,
        status: p.status,
        hasActed: p.hasActed,
        // Only show cards to the player themselves
        cards:
          p.userId === viewerUserId
            ? handState.playerHands.find((h) => h.userId === p.userId)?.cards ||
              []
            : [],
      })),
    };
  }
}
