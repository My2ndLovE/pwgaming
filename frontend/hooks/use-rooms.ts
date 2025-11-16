'use client';

import { useState, useEffect, useCallback } from 'react';
import { roomsApi, Room } from '@/lib/api/rooms';
import { useAuth } from './use-auth';
import { tokenStorage } from '@/lib/token-storage';

interface UseRoomsReturn {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  joinRoom: (roomId: string, buyInAmount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRooms(): UseRoomsReturn {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await roomsApi.listRooms(token, 'active');
      setRooms(response.rooms);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch rooms';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const joinRoom = useCallback(
    async (roomId: string, buyInAmount: number) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await roomsApi.joinRoom(token, roomId, buyInAmount);
        // Redirect to game page would happen here
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to join room';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    isLoading,
    error,
    joinRoom,
    refresh,
  };
}
