'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Pause, Play, XCircle, Download, Eye } from 'lucide-react';

interface LiveGame {
  roomId: string;
  playerCount: number;
  pot: number;
  phase: string;
  bigBlind: number;
  status: 'active' | 'paused';
}

export default function LiveGamesMonitor() {
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    // Mock data - replace with real WebSocket connection
    setGames([
      { roomId: 'room-1', playerCount: 6, pot: 1500, phase: 'flop', bigBlind: 100, status: 'active' },
      { roomId: 'room-2', playerCount: 4, pot: 800, phase: 'preflop', bigBlind: 50, status: 'active' },
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Live Game Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Card key={game.roomId} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">{game.roomId}</h3>
                <Badge variant={game.status === 'active' ? 'success' : 'default'}>
                  {game.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {game.playerCount}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pot:</span>
                <span className="font-medium">${game.pot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phase:</span>
                <span className="font-medium capitalize">{game.phase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Big Blind:</span>
                <span className="font-medium">${game.bigBlind}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button size="sm" variant="outline">
                {game.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button size="sm" variant="outline">
                <XCircle className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
