import React from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * T091-T094: Mobile-optimized poker table component
 * Responsive layout for small screens with touch controls
 */

interface Player {
  id: string;
  username: string;
  chipStack: number;
  position: number;
  isActive: boolean;
  currentBet: number;
  cards?: string[];
}

interface MobilePokerTableProps {
  players: Player[];
  communityCards: string[];
  pot: number;
  currentPlayer?: string;
  onFold?: () => void;
  onCall?: () => void;
  onRaise?: (amount: number) => void;
  onCheck?: () => void;
}

export function MobilePokerTable({
  players,
  communityCards,
  pot,
  currentPlayer,
  onFold,
  onCall,
  onRaise,
  onCheck,
}: MobilePokerTableProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Return desktop version (existing component)
    return null;
  }

  // T091: Identify current player's position
  const currentPlayerData = players.find((p) => p.id === currentPlayer);

  return (
    <div className="mobile-poker-table min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex flex-col">
      {/* T092: Compact opponent info at top */}
      <div className="opponents-section p-2 bg-gray-800/50 backdrop-blur">
        <div className="grid grid-cols-3 gap-2">
          {players
            .filter((p) => p.id !== currentPlayer)
            .slice(0, 6)
            .map((player) => (
              <div
                key={player.id}
                className="opponent-card bg-gray-700/80 rounded-lg p-2 text-center"
              >
                <div className="text-xs font-semibold text-white truncate">
                  {player.username}
                </div>
                <div className="text-sm text-green-400 font-bold">
                  ${player.chipStack.toLocaleString()}
                </div>
                {player.currentBet > 0 && (
                  <div className="text-xs text-yellow-400">
                    Bet: ${player.currentBet}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* T093: Community cards and pot in center */}
      <div className="table-center flex-1 flex flex-col items-center justify-center p-4">
        {/* Pot */}
        <div className="pot-display mb-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-full px-6 py-3">
          <div className="text-xs text-yellow-300 font-semibold">POT</div>
          <div className="text-2xl text-yellow-400 font-bold">
            ${pot.toLocaleString()}
          </div>
        </div>

        {/* Community Cards */}
        {communityCards.length > 0 && (
          <div className="community-cards flex gap-2">
            {communityCards.map((card, index) => (
              <div
                key={index}
                className="card bg-white rounded-lg shadow-lg p-3 text-center min-w-[50px]"
              >
                <div className="text-2xl font-bold">{card}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* T094: Current player info and controls at bottom */}
      {currentPlayerData && (
        <div className="player-section bg-gray-800 border-t-4 border-blue-500 p-4">
          {/* Player info */}
          <div className="player-info flex justify-between items-center mb-4">
            <div>
              <div className="text-lg font-bold text-white">
                {currentPlayerData.username}
              </div>
              <div className="text-sm text-gray-400">
                Position: {currentPlayerData.position}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Chips</div>
              <div className="text-2xl font-bold text-green-400">
                ${currentPlayerData.chipStack.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Player cards */}
          {currentPlayerData.cards && currentPlayerData.cards.length > 0 && (
            <div className="player-cards flex gap-3 justify-center mb-4">
              {currentPlayerData.cards.map((card, index) => (
                <div
                  key={index}
                  className="card bg-white rounded-lg shadow-xl p-4 text-center min-w-[70px]"
                >
                  <div className="text-3xl font-bold">{card}</div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons - large touch targets */}
          <div className="action-buttons grid grid-cols-2 gap-3">
            {onCheck && (
              <button
                onClick={onCheck}
                className="action-btn bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-lg"
              >
                Check
              </button>
            )}
            {onCall && (
              <button
                onClick={onCall}
                className="action-btn bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-lg"
              >
                Call
              </button>
            )}
            {onRaise && (
              <button
                onClick={() => onRaise(100)}
                className="action-btn bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-lg"
              >
                Raise
              </button>
            )}
            {onFold && (
              <button
                onClick={onFold}
                className="action-btn bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all text-lg"
              >
                Fold
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
