'use client';

import { useState } from 'react';
import { Room } from '@/lib/api/rooms';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string, buyInAmount: number) => Promise<void>;
  userBalance: number;
  isLoading: boolean;
}

export function RoomCard({ room, onJoin, userBalance, isLoading }: RoomCardProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(room.minBuyIn.toString());
  const [error, setError] = useState('');

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleJoinClick = () => {
    setShowJoinModal(true);
    setBuyInAmount(room.minBuyIn.toString());
    setError('');
  };

  const handleJoinSubmit = async () => {
    const amount = parseFloat(buyInAmount);

    if (isNaN(amount) || amount < room.minBuyIn) {
      setError(`Minimum buy-in is ${formatAmount(room.minBuyIn)}`);
      return;
    }

    if (amount > room.maxBuyIn) {
      setError(`Maximum buy-in is ${formatAmount(room.maxBuyIn)}`);
      return;
    }

    if (amount > userBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      await onJoin(room.id, amount);
      setShowJoinModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const isFull = room.currentPlayers >= room.maxPlayers;

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold">{room.name}</h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {room.currentPlayers}/{room.maxPlayers}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>
                {formatAmount(room.smallBlind)}/{formatAmount(room.bigBlind)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min Buy-in:</span>
            <span className="font-semibold">{formatAmount(room.minBuyIn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Buy-in:</span>
            <span className="font-semibold">{formatAmount(room.maxBuyIn)}</span>
          </div>
        </div>

        <Button
          onClick={handleJoinClick}
          disabled={isFull || isLoading}
          className="w-full"
        >
          {isFull ? 'Room Full' : 'Join Room'}
        </Button>
      </Card>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">Join {room.name}</h3>

            <div className="mb-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Your Balance: {formatAmount(userBalance)}
              </p>
              <Input
                label="Buy-in Amount"
                type="number"
                step="0.01"
                min={room.minBuyIn}
                max={Math.min(room.maxBuyIn, userBalance)}
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(e.target.value)}
                error={error}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Min: {formatAmount(room.minBuyIn)} | Max:{' '}
                {formatAmount(room.maxBuyIn)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleJoinSubmit} disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowJoinModal(false);
                  setError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
