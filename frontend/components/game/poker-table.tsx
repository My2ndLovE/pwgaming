'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../../hooks/use-game-state';
import { PlayerSeat } from './player-seat';
import { ActionButtons } from './action-buttons';
import { CommunityCards } from './community-cards';
import { DealerButton } from './dealer-button';
import { ChipStack } from './chip-stack';
import { ActionHistory, ActionHistoryItem } from './action-history';
import { ConnectionStatus, ConnectionState } from './connection-status';
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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-sm font-semibold mb-2 uppercase tracking-wider"
              >
                {state.phase}
              </motion.div>

              {/* Community cards */}
              <CommunityCards cards={state.communityCards} phase={state.phase as HandPhase} />

              {/* Pot with chip animation */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4"
              >
                <ChipStack amount={potTotal} size="lg" animated={true} />
              </motion.div>
            </div>
          </div>

          {/* Dealer button */}
          {state.dealerPosition !== undefined && (
            <DealerButton position={state.dealerPosition} totalSeats={state.players.length} />
          )}

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

      {/* Winners announcement with celebration animation */}
      <AnimatePresence>
        {gameState.lastWinners && gameState.lastWinners.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-xl p-8 shadow-2xl max-w-md border-4 border-yellow-600"
            >
              <motion.h3
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-3xl font-bold mb-4 text-center text-white drop-shadow-lg"
              >
                🎉 Winner! 🎉
              </motion.h3>
              {gameState.lastWinners.map((winner, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="mb-4 p-4 bg-white/90 backdrop-blur rounded-lg shadow-lg"
                >
                  <div className="font-bold text-gray-900 text-lg">{winner.userId}</div>
                  <div className="text-sm text-gray-700 font-semibold">{winner.handName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {winner.handCards.join(' ')}
                  </div>
                </motion.div>
              ))}
              {gameState.lastPots && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 pt-4 border-t border-white/30"
                >
                  {gameState.lastPots.map((pot, idx) => (
                    <div key={idx} className="text-sm text-white font-medium">
                      Pot {idx + 1}: ${pot.amount}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action History */}
      <div className="absolute top-4 right-4 z-30 max-w-xs">
        <ActionHistory
          actions={gameState.recentActions.map((action, idx) => ({
            id: `${action.userId}-${idx}`,
            timestamp: Date.now(),
            playerName: action.userId,
            action: action.action as any,
            amount: action.amount,
          }))}
          maxItems={10}
          compact={true}
        />
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-30">
        <ConnectionStatus
          status={gameState.isConnected ? 'connected' : 'disconnected'}
          compact={true}
          showLatency={false}
        />
      </div>
    </div>
  );
}
