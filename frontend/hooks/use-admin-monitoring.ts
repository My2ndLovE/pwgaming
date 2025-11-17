import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LiveGame {
  roomId: string;
  playerCount: number;
  pot: number;
  phase: string;
  bigBlind: number;
  status: 'active' | 'paused';
}

export function useAdminMonitoring() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('/admin', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('gameUpdate', (game: LiveGame) => {
      setGames((prev) => {
        const index = prev.findIndex((g) => g.roomId === game.roomId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = game;
          return updated;
        }
        return [...prev, game];
      });
    });

    socketInstance.on('gameRemoved', ({ roomId }: { roomId: string }) => {
      setGames((prev) => prev.filter((g) => g.roomId !== roomId));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const pauseGame = async (roomId: string) => {
    const response = await fetch(`/api/admin/games/${roomId}/pause`, {
      method: 'POST',
    });
    return response.json();
  };

  const resumeGame = async (roomId: string) => {
    const response = await fetch(`/api/admin/games/${roomId}/resume`, {
      method: 'POST',
    });
    return response.json();
  };

  const cancelHand = async (roomId: string, reason: string) => {
    const response = await fetch(`/api/admin/games/${roomId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return response.json();
  };

  return {
    games,
    connected,
    pauseGame,
    resumeGame,
    cancelHand,
  };
}
