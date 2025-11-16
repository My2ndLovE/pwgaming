'use client';

import React from 'react';
import { Player, SeatStatus } from '../../types/game';
import { PlayingCard } from './playing-card';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  isDealer: boolean;
  isYou: boolean;
  cards: string[];
  timer: number | null;
}

export function PlayerSeat({
  player,
  isCurrentTurn,
  isDealer,
  isYou,
  cards,
  timer,
}: PlayerSeatProps) {
  const isFolded = player.status === SeatStatus.FOLDED;
  const isAllIn = player.status === SeatStatus.ALL_IN;
  const isActive = player.status === SeatStatus.ACTIVE;

  return (
    <div className="relative">
      {/* Timer */}
      {timer !== null && isCurrentTurn && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center font-bold text-white
            ${timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}
          `}>
            {timer}
          </div>
        </div>
      )}

      {/* Dealer button */}
      {isDealer && (
        <div className="absolute -top-6 -right-6 w-8 h-8 bg-white rounded-full border-4 border-amber-500 flex items-center justify-center shadow-lg z-10">
          <div className="text-amber-500 font-bold text-xs">D</div>
        </div>
      )}

      {/* Player info card */}
      <div className={`
        relative bg-white rounded-lg shadow-xl p-3 min-w-[160px]
        ${isCurrentTurn ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
        ${isFolded ? 'opacity-50 grayscale' : ''}
        ${isYou ? 'border-4 border-blue-500' : ''}
        transition-all duration-200
      `}>
        {/* Player name and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="font-bold text-sm truncate">
              {isYou ? 'You' : player.userId}
            </div>
            {isAllIn && (
              <div className="text-xs text-red-600 font-bold">ALL IN</div>
            )}
            {isFolded && (
              <div className="text-xs text-gray-500">FOLDED</div>
            )}
          </div>
        </div>

        {/* Chip stack */}
        <div className="bg-gray-100 rounded px-2 py-1 mb-2">
          <div className="text-xs text-gray-600">Chips</div>
          <div className="font-bold text-green-700">${player.chipStack}</div>
        </div>

        {/* Current bet */}
        {player.currentBet > 0 && (
          <div className="bg-amber-100 rounded px-2 py-1 mb-2">
            <div className="text-xs text-amber-800">Bet</div>
            <div className="font-bold text-amber-900">${player.currentBet}</div>
          </div>
        )}

        {/* Cards */}
        {(isYou && cards.length > 0) && (
          <div className="flex gap-1 mt-2 justify-center">
            {cards.map((card, idx) => (
              <PlayingCard key={idx} card={card} faceUp={true} size="sm" />
            ))}
          </div>
        )}

        {/* Opponent cards (face down) */}
        {!isYou && isActive && !isFolded && (
          <div className="flex gap-1 mt-2 justify-center">
            <PlayingCard card="" faceUp={false} size="sm" />
            <PlayingCard card="" faceUp={false} size="sm" />
          </div>
        )}

        {/* Action indicator */}
        {player.hasActed && !isFolded && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              ✓ Acted
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
