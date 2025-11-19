'use client';

import React, { useState, useEffect } from 'react';
import { UseGameStateReturn } from '../../hooks/use-game-state';
import { useKeyboardShortcuts } from '../../hooks/use-keyboard-shortcuts';

interface ActionButtonsProps {
  gameState: UseGameStateReturn;
  enableKeyboardShortcuts?: boolean;
}

export function ActionButtons({
  gameState,
  enableKeyboardShortcuts = true,
}: ActionButtonsProps) {
  const [betAmount, setBetAmount] = useState(0);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setError(null);
      setIsLoading(true);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFold: () => gameState.isYourTurn && handleAction(gameState.fold),
    onCheck: () => gameState.isYourTurn && gameState.canCheck && handleAction(gameState.check),
    onCall: () => gameState.isYourTurn && gameState.canCall && handleAction(gameState.call),
    onRaise: () => gameState.isYourTurn && gameState.canRaise && raiseAmount >= gameState.minRaiseAmount && handleAction(() => gameState.raise(raiseAmount)),
    onBet: () => gameState.isYourTurn && gameState.canBet && betAmount >= gameState.minBetAmount && handleAction(() => gameState.bet(betAmount)),
    onAllIn: () => gameState.isYourTurn && handleAction(gameState.allIn),
    enabled: enableKeyboardShortcuts && gameState.isYourTurn,
  });

  if (!gameState.isYourTurn) {
    return (
      <div className="text-center text-white text-sm">
        Waiting for your turn...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 justify-center flex-wrap" role="group" aria-label="Poker actions">
        {/* Fold */}
        <button
          onClick={() => handleAction(gameState.fold)}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg relative"
          aria-label="Fold your hand (Keyboard: F)"
          aria-keyshortcuts="F"
        >
          {isLoading && <span className="absolute left-2">⏳</span>}
          Fold <span className="text-xs opacity-75">(F)</span>
        </button>

        {/* Check */}
        {gameState.canCheck && (
          <button
            onClick={() => handleAction(gameState.check)}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg relative"
            aria-label="Check (Keyboard: C)"
            aria-keyshortcuts="C"
          >
            {isLoading && <span className="absolute left-2">⏳</span>}
            Check <span className="text-xs opacity-75">(C)</span>
          </button>
        )}

        {/* Call */}
        {gameState.canCall && (
          <button
            onClick={() => handleAction(gameState.call)}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg relative"
            aria-label={`Call ${gameState.callAmount} chips (Keyboard: K)`}
            aria-keyshortcuts="K"
          >
            {isLoading && <span className="absolute left-2">⏳</span>}
            Call ${gameState.callAmount} <span className="text-xs opacity-75">(K)</span>
          </button>
        )}

        {/* All In */}
        <button
          onClick={() => handleAction(gameState.allIn)}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg relative"
          aria-label={`Go all in with ${gameState.yourPlayer?.chipStack || 0} chips (Keyboard: A)`}
          aria-keyshortcuts="A"
        >
          {isLoading && <span className="absolute left-2">⏳</span>}
          All In {gameState.yourPlayer && `($${gameState.yourPlayer.chipStack})`}{' '}
          <span className="text-xs opacity-75">(A)</span>
        </button>
      </div>

      {/* Bet controls */}
      {gameState.canBet && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <label className="block text-white text-sm font-semibold mb-2">
            Bet Amount (min: ${gameState.minBetAmount})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={betAmount || ''}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min={gameState.minBetAmount}
              max={gameState.yourPlayer?.chipStack || 0}
              className="flex-1 bg-white rounded-lg px-4 py-2 text-black"
              placeholder={`Min: $${gameState.minBetAmount}`}
            />
            <button
              onClick={() => handleAction(() => gameState.bet(betAmount))}
              disabled={betAmount < gameState.minBetAmount || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors relative"
            >
              {isLoading && <span className="absolute left-2">⏳</span>}
              Bet
            </button>
          </div>
          {/* Quick bet buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setBetAmount(gameState.minBetAmount)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
            >
              Min
            </button>
            {gameState.yourPlayer && (
              <>
                <button
                  onClick={() => setBetAmount(Math.floor(gameState.yourPlayer!.chipStack / 2))}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  1/2 Pot
                </button>
                <button
                  onClick={() => setBetAmount(Math.floor(gameState.yourPlayer!.chipStack * 0.75))}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  3/4 Pot
                </button>
                <button
                  onClick={() => setBetAmount(gameState.yourPlayer!.chipStack)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  Pot
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Raise controls */}
      {gameState.canRaise && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <label className="block text-white text-sm font-semibold mb-2">
            Raise To (min: ${gameState.minRaiseAmount})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={raiseAmount || ''}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              min={gameState.minRaiseAmount}
              max={gameState.yourPlayer?.chipStack || 0}
              className="flex-1 bg-white rounded-lg px-4 py-2 text-black"
              placeholder={`Min: $${gameState.minRaiseAmount}`}
            />
            <button
              onClick={() => handleAction(() => gameState.raise(raiseAmount))}
              disabled={raiseAmount < gameState.minRaiseAmount || isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors relative"
            >
              {isLoading && <span className="absolute left-2">⏳</span>}
              Raise
            </button>
          </div>
          {/* Quick raise buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setRaiseAmount(gameState.minRaiseAmount)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
            >
              Min
            </button>
            {gameState.yourPlayer && gameState.gameState && (
              <>
                <button
                  onClick={() => setRaiseAmount(gameState.gameState!.currentBet * 2)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  2x
                </button>
                <button
                  onClick={() => setRaiseAmount(gameState.gameState!.currentBet * 3)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  3x
                </button>
                <button
                  onClick={() => setRaiseAmount(gameState.yourPlayer!.chipStack)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-2 rounded"
                >
                  Max
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
