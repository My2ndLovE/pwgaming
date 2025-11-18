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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeckService } from '../services/deck.service';

interface GameState {
  roomId: string;
  handNumber: number;
  dealerPosition: number;
  currentTurn: number;
  pot: number;
  communityCards: string[];
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  players: Array<{
    userId: string;
    position: number;
    chips: number;
    currentBet: number;
    cards: string[];
    status: 'active' | 'folded' | 'all_in';
  }>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(JwtAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private gameStates: Map<string, GameState> = new Map();
  private connectedPlayers: Map<string, Socket> = new Map();

  constructor(private readonly deckService: DeckService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // TODO: Handle player reconnection logic
  }

  @SubscribeMessage('game:join')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; buyIn: number },
  ) {
    const { roomId, userId, buyIn } = data;

    // Join room
    client.join(roomId);
    this.connectedPlayers.set(userId, client);

    // Initialize game state if needed
    if (!this.gameStates.has(roomId)) {
      this.gameStates.set(roomId, {
        roomId,
        handNumber: 0,
        dealerPosition: 0,
        currentTurn: 0,
        pot: 0,
        communityCards: [],
        phase: 'preflop',
        players: [],
      });
    }

    const gameState = this.gameStates.get(roomId)!;

    // Add player to game
    gameState.players.push({
      userId,
      position: gameState.players.length,
      chips: buyIn,
      currentBet: 0,
      cards: [],
      status: 'active',
    });

    // Broadcast updated state
    this.server
      .to(roomId)
      .emit('game:state', this.sanitizeGameState(gameState));

    // Start game if we have 2+ players
    if (gameState.players.length >= 2 && gameState.handNumber === 0) {
      setTimeout(() => this.startNewHand(roomId), 2000);
    }

    return { success: true, message: 'Joined game successfully' };
  }

  @SubscribeMessage('game:action')
  async handlePlayerAction(
    @MessageBody()
    data: {
      roomId: string;
      action: 'fold' | 'check' | 'call' | 'bet' | 'raise';
      amount?: number;
    },
  ) {
    const { roomId, action, amount } = data;
    const gameState = this.gameStates.get(roomId);

    if (!gameState) {
      return { success: false, message: 'Game not found' };
    }

    // TODO: Validate action and update game state
    // For MVP: simplified action handling

    // Broadcast action to all players
    this.server.to(roomId).emit('game:action', {
      action,
      amount,
      timestamp: new Date(),
    });

    return { success: true };
  }

  private startNewHand(roomId: string) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) return;

    gameState.handNumber += 1;
    gameState.pot = 0;
    gameState.communityCards = [];
    gameState.phase = 'preflop';

    // Shuffle and deal
    const deck = this.deckService.shuffle(this.deckService.createDeck());
    let remaining = deck;

    // Deal 2 cards to each player
    for (const player of gameState.players) {
      const { dealt, remaining: newRemaining } = this.deckService.dealCards(
        remaining,
        2,
      );
      player.cards = dealt;
      player.status = 'active';
      player.currentBet = 0;
      remaining = newRemaining;
    }

    // Broadcast game started
    this.server.to(roomId).emit('game:hand_started', {
      handNumber: gameState.handNumber,
      dealerPosition: gameState.dealerPosition,
    });

    // Send private cards to each player
    for (const player of gameState.players) {
      const socket = this.connectedPlayers.get(player.userId);
      if (socket) {
        socket.emit('game:your_cards', { cards: player.cards });
      }
    }

    // Broadcast public state
    this.server
      .to(roomId)
      .emit('game:state', this.sanitizeGameState(gameState));
  }

  private sanitizeGameState(gameState: GameState): any {
    return {
      ...gameState,
      players: gameState.players.map((p) => ({
        userId: p.userId,
        position: p.position,
        chips: p.chips,
        currentBet: p.currentBet,
        status: p.status,
        // Don't send cards to other players
        cards: [],
      })),
    };
  }
}
