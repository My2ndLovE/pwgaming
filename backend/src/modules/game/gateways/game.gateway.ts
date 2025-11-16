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
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../../realtime/guards/ws-auth.guard';
import { GameEngine, HandState } from '../services/game-engine.service';
import { TimeoutService } from '../services/timeout.service';
import { ActionType } from '../entities/betting-action.entity';
import { HandPhase } from '../entities/game-hand.entity';

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
})
@UseGuards(WsAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private rooms: Map<string, RoomState> = new Map();
  private connectedPlayers: Map<string, { socket: Socket; roomId: string }> = new Map();
  private reconnectionTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly gameEngine: GameEngine,
    private readonly timeoutService: TimeoutService,
  ) {}

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
    if (userId) {
      console.log(`User ${userId} disconnected (socket: ${client.id})`);

      const playerInfo = this.connectedPlayers.get(userId);
      if (playerInfo) {
        // Start 60-second grace period for reconnection
        const timer = setTimeout(() => {
          this.handlePlayerTimeout(userId, playerInfo.roomId);
        }, 60000);

        this.reconnectionTimers.set(userId, timer);
      }
    }
  }

  @SubscribeMessage('game:join')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; buyIn: number },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId, buyIn } = data;

    // Join Socket.IO room
    client.join(roomId);

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

    // Track connected player
    this.connectedPlayers.set(userId, { socket: client, roomId });

    // Clear any reconnection timer
    if (this.reconnectionTimers.has(userId)) {
      clearTimeout(this.reconnectionTimers.get(userId)!);
      this.reconnectionTimers.delete(userId);
    }

    // Initialize hand if first players joining
    if (!room.handState) {
      const players = [{ userId, chipStack: buyIn, position: 0 }];
      room.handState = this.gameEngine.startNewHand(
        players,
        0,
        room.smallBlind,
        room.bigBlind
      );

      this.broadcastGameState(roomId);
      this.sendPrivateCards(roomId);
    } else {
      // Add player to existing game (between hands)
      // This would require GameEngine support for dynamic player addition
      // For now, just send current state
      this.sendGameState(client, roomId);
    }

    return { success: true };
  }

  @SubscribeMessage('game:action')
  async handlePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; action: ActionType; amount: number },
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

    // Clear action timer for this player
    const handId = `${roomId}-hand-${room.handState.state.phase}`;
    this.timeoutService.clearActionTimer(handId, userId);

    // Process action through GameEngine
    const result = this.gameEngine.processAction(
      room.handState,
      userId,
      action,
      amount
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Broadcast action to all players
    this.server.to(roomId).emit('game:player_action', {
      userId,
      action,
      amount,
      timestamp: new Date(),
    });

    // Check if betting round is complete
    if (this.gameEngine.isBettingRoundComplete(room.handState.state)) {
      // Check if hand is complete
      if (this.gameEngine.isHandComplete(
        room.handState.state.activePlayers,
        room.handState.state.phase
      )) {
        this.handleHandComplete(roomId);
      } else {
        // Advance to next phase
        this.handleAdvancePhase(roomId);
      }
    } else {
      // Start timer for next player
      const currentPlayer = room.handState.state.activePlayers.find(
        p => p.position === room.handState!.state.currentPosition
      );
      if (currentPlayer) {
        this.startActionTimer(roomId, currentPlayer.userId);
      }
    }

    // Broadcast updated state
    this.broadcastGameState(roomId);

    return { success: true, state: this.sanitizeState(room.handState, userId) };
  }

  @SubscribeMessage('game:leave')
  async handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.user?.userId;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { roomId } = data;

    client.leave(roomId);
    this.connectedPlayers.delete(userId);

    // TODO: Implement cash-out logic
    // TODO: Mark player as sitting out if mid-hand

    return { success: true };
  }

  // Private helper methods

  private handleReconnection(userId: string, newSocket: Socket) {
    const existing = this.connectedPlayers.get(userId)!;
    const { roomId } = existing;

    // Clear reconnection timer
    if (this.reconnectionTimers.has(userId)) {
      clearTimeout(this.reconnectionTimers.get(userId)!);
      this.reconnectionTimers.delete(userId);
    }

    // Update socket reference
    this.connectedPlayers.set(userId, { socket: newSocket, roomId });
    newSocket.join(roomId);

    // Send current game state
    this.sendGameState(newSocket, roomId);

    // Notify others
    this.server.to(roomId).emit('game:player_reconnected', { userId });
  }

  private handlePlayerTimeout(userId: string, roomId: string) {
    console.log(`Player ${userId} timed out in room ${roomId}`);

    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // Auto-fold if it's their turn
    const currentPlayer = room.handState.state.activePlayers.find(
      p => p.position === room.handState!.state.currentPosition
    );

    if (currentPlayer && currentPlayer.userId === userId) {
      this.gameEngine.processAction(
        room.handState,
        userId,
        ActionType.FOLD,
        0
      );

      this.broadcastGameState(roomId);

      // Continue game
      if (this.gameEngine.isHandComplete(
        room.handState.state.activePlayers,
        room.handState.state.phase
      )) {
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
      p => p.position === room.handState!.state.currentPosition
    );
    if (firstPlayer) {
      this.startActionTimer(roomId, firstPlayer.userId);
    }

    this.broadcastGameState(roomId);
  }

  private handleHandComplete(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

    // Evaluate winners
    const winners = this.gameEngine.evaluateWinners(
      room.handState.playerHands,
      room.handState.communityCards
    );

    // Calculate pots
    const contributions = room.handState.state.activePlayers.map(p => ({
      userId: p.userId,
      amount: p.currentBet || 0,
    }));
    const pots = this.gameEngine.calculatePots(contributions);

    // Broadcast hand complete
    this.server.to(roomId).emit('game:hand_complete', {
      winners,
      pots,
    });

    // Clear all action timers
    const handId = `${roomId}-hand-${room.handState.state.phase}`;
    this.timeoutService.clearAllTimersForHand(handId);

    // Start new hand after 5 seconds
    setTimeout(() => {
      this.startNewHand(roomId);
    }, 5000);
  }

  private startNewHand(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const connectedPlayers = Array.from(this.connectedPlayers.values())
      .filter(p => p.roomId === roomId)
      .map((p, idx) => ({
        userId: p.socket.data.user?.userId,
        chipStack: 1000, // TODO: Track chip stacks
        position: idx,
      }));

    if (connectedPlayers.length < 2) {
      return; // Need at least 2 players
    }

    // Start new hand
    const dealerPosition = room.handState
      ? this.gameEngine['stateMachine'].calculateNextDealer(
          room.handState.state.dealerPosition,
          connectedPlayers
        )
      : 0;

    room.handState = this.gameEngine.startNewHand(
      connectedPlayers,
      dealerPosition,
      room.smallBlind,
      room.bigBlind
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
      p => p.position === room.handState!.state.currentPosition
    );
    if (firstPlayer) {
      this.startActionTimer(roomId, firstPlayer.userId);
    }
  }

  private startActionTimer(roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

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
            0
          );

          this.server.to(roomId).emit('game:player_timeout', { userId: playerId });
          this.broadcastGameState(roomId);
        }
      }
    );

    // Broadcast timer started
    this.server.to(roomId).emit('game:timer_started', {
      userId,
      seconds: room.actionTimeoutSeconds,
    });
  }

  private broadcastGameState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.handState) return;

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

    room.handState.playerHands.forEach(hand => {
      const playerInfo = this.connectedPlayers.get(hand.userId);
      if (playerInfo) {
        playerInfo.socket.emit('game:your_cards', {
          cards: hand.cards,
        });
      }
    });
  }

  private sanitizeState(handState: HandState, viewerUserId: string): any {
    return {
      phase: handState.state.phase,
      dealerPosition: handState.state.dealerPosition,
      currentPosition: handState.state.currentPosition,
      currentBet: handState.state.currentBet,
      minRaise: handState.state.minRaise,
      communityCards: handState.communityCards,
      players: handState.state.activePlayers.map(p => ({
        userId: p.userId,
        position: p.position,
        chipStack: p.chipStack,
        currentBet: p.currentBet,
        status: p.status,
        hasActed: p.hasActed,
        // Only show cards to the player themselves
        cards: p.userId === viewerUserId ? handState.playerHands.find(h => h.userId === p.userId)?.cards || [] : [],
      })),
    };
  }
}
