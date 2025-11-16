'use client';

import React, { useState } from 'react';
import { UseGameStateReturn } from '../../hooks/use-game-state';

interface ActionButtonsProps {
  gameState: UseGameStateReturn;
}

export function ActionButtons({ gameState }: ActionButtonsProps) {
  const [betAmount, setBetAmount] = useState(0);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

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
      <div className="flex gap-3 justify-center flex-wrap">
        {/* Fold */}
        <button
          onClick={() => handleAction(gameState.fold)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
        >
          Fold
        </button>

        {/* Check */}
        {gameState.canCheck && (
          <button
            onClick={() => handleAction(gameState.check)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
          >
            Check
          </button>
        )}

        {/* Call */}
        {gameState.canCall && (
          <button
            onClick={() => handleAction(gameState.call)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
          >
            Call ${gameState.callAmount}
          </button>
        )}

        {/* All In */}
        <button
          onClick={() => handleAction(gameState.allIn)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
        >
          All In {gameState.yourPlayer && `($${gameState.yourPlayer.chipStack})`}
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
              disabled={betAmount < gameState.minBetAmount}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
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
              disabled={raiseAmount < gameState.minRaiseAmount}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
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
