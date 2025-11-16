'use client';

import React from 'react';
import { useGameState } from '../../hooks/use-game-state';
import { PlayerSeat } from './player-seat';
import { ActionButtons } from './action-buttons';
import { CommunityCards } from './community-cards';
import { HandPhase } from '../../types/game';

interface PokerTableProps {
  roomId: string;
  userId: string;
  token?: string;
}

export function PokerTable({ roomId, userId, token }: PokerTableProps) {
  const gameState = useGameState({ roomId, userId, token });

  if (!gameState.isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-green-900">
        <div className="text-white text-2xl">Connecting to game...</div>
      </div>
    );
  }

  if (!gameState.gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-800 to-green-900">
        <div className="bg-white rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Join Game</h2>
          <button
            onClick={() => gameState.joinGame(1000)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Join with $1,000
          </button>
        </div>
      </div>
    );
  }

  const { gameState: state, yourCards } = gameState;

  // Calculate pot total
  const potTotal = state.players.reduce((sum, p) => sum + p.currentBet, 0);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-800 to-green-900 overflow-hidden">
      {/* Table */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {/* Poker table ellipse */}
        <div className="relative w-full max-w-6xl aspect-[2/1]">
          {/* Table surface */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900 rounded-[50%] border-8 border-amber-900 shadow-2xl">
            {/* Felt texture */}
            <div className="absolute inset-4 rounded-[50%] bg-green-800 opacity-50" />

            {/* Table rail */}
            <div className="absolute inset-0 rounded-[50%] shadow-inner" style={{
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
            }} />
          </div>

          {/* Community cards area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="text-center">
              {/* Phase indicator */}
              <div className="text-white text-sm font-semibold mb-2 uppercase tracking-wider">
                {state.phase}
              </div>

              {/* Community cards */}
              <CommunityCards cards={state.communityCards} phase={state.phase as HandPhase} />

              {/* Pot */}
              <div className="mt-4 bg-amber-800 rounded-lg px-4 py-2 shadow-lg">
                <div className="text-amber-200 text-xs">POT</div>
                <div className="text-white text-2xl font-bold">${potTotal}</div>
              </div>
            </div>
          </div>

          {/* Player seats (positioned around ellipse) */}
          {state.players.map((player, index) => {
            // Position players around the ellipse
            const angle = (index / state.players.length) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + 45 * Math.cos(angle);
            const y = 50 + 35 * Math.sin(angle);

            return (
              <div
                key={player.userId}
                className="absolute z-20"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <PlayerSeat
                  player={player}
                  isCurrentTurn={player.position === state.currentPosition}
                  isDealer={player.position === state.dealerPosition}
                  isYou={player.userId === userId}
                  cards={player.userId === userId ? yourCards : []}
                  timer={
                    gameState.actionTimer?.userId === player.userId
                      ? gameState.actionTimer.remainingSeconds
                      : null
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Your hand (bottom of screen) */}
      {gameState.yourPlayer && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/50 to-transparent pb-8 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            {/* Action buttons */}
            <ActionButtons gameState={gameState} />
          </div>
        </div>
      )}

      {/* Winners announcement */}
      {gameState.lastWinners && gameState.lastWinners.length > 0 && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md">
            <h3 className="text-2xl font-bold mb-4 text-center">Hand Complete!</h3>
            {gameState.lastWinners.map((winner, idx) => (
              <div key={idx} className="mb-4 p-4 bg-amber-50 rounded-lg">
                <div className="font-bold">{winner.userId}</div>
                <div className="text-sm text-gray-600">{winner.handName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {winner.handCards.join(' ')}
                </div>
              </div>
            ))}
            {gameState.lastPots && (
              <div className="mt-4 pt-4 border-t">
                {gameState.lastPots.map((pot, idx) => (
                  <div key={idx} className="text-sm">
                    Pot {idx + 1}: ${pot.amount}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent actions */}
      <div className="absolute top-4 right-4 z-30 bg-black/50 rounded-lg p-4 max-w-xs">
        <h4 className="text-white text-sm font-bold mb-2">Recent Actions</h4>
        <div className="space-y-1">
          {gameState.recentActions.slice(-5).map((action, idx) => (
            <div key={idx} className="text-white text-xs">
              <span className="font-semibold">{action.userId}</span>{' '}
              <span className="text-gray-300">{action.action}</span>
              {action.amount > 0 && (
                <span className="text-amber-300"> ${action.amount}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
