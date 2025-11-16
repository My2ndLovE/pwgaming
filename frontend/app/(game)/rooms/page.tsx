'use client';

import { useRooms } from '@/hooks/use-rooms';
import { useWallet } from '@/hooks/use-wallet';
import { RoomCard } from '@/components/room/room-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { RefreshCw, Gamepad2 } from 'lucide-react';

export default function RoomsPage() {
  const { rooms, isLoading, error, joinRoom, refresh } = useRooms();
  const { balance } = useWallet();

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Game Rooms</h1>
            <p className="text-muted-foreground">
              Browse and join available poker rooms
            </p>
          </div>
          <Button onClick={refresh} disabled={isLoading} variant="outline">
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading && rooms.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading rooms..." />
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Gamepad2 className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Active Rooms</h3>
            <p className="text-sm text-muted-foreground">
              Check back later or create your own room
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={joinRoom}
                userBalance={balance}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
