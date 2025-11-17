import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface LiveGameData {
  roomId: string;
  playerCount: number;
  pot: number;
  phase: string;
  bigBlind: number;
  status: 'active' | 'paused';
  players: {
    userId: string;
    chipStack: number;
    position: number;
  }[];
}

@Injectable()
@WebSocketGateway({ namespace: '/admin' })
export class AdminMonitoringService {
  @WebSocketServer()
  server!: Server;

  private liveGames: Map<string, LiveGameData> = new Map();

  broadcastGameUpdate(roomId: string, gameData: LiveGameData) {
    this.liveGames.set(roomId, gameData);
    this.server.emit('gameUpdate', gameData);
  }

  getAllLiveGames(): LiveGameData[] {
    return Array.from(this.liveGames.values());
  }

  getGameStats() {
    return {
      totalGames: this.liveGames.size,
      totalPlayers: Array.from(this.liveGames.values()).reduce(
        (sum, game) => sum + game.playerCount,
        0,
      ),
      activeTables: Array.from(this.liveGames.values()).filter(
        (g) => g.status === 'active',
      ).length,
    };
  }

  removeGame(roomId: string) {
    this.liveGames.delete(roomId);
    this.server.emit('gameRemoved', { roomId });
  }
}
