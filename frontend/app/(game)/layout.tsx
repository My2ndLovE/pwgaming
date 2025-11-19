/**
 * Game layout
 * Protected layout for game-related pages
 * T077: Game-specific error boundary integration
 */

import { ProtectedRoute } from '@/components/auth/protected-route';
import { ErrorBoundary } from '@/components/error/error-boundary';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-4">Game Error</h2>
              <p className="text-gray-300 mb-6">
                An error occurred in the game. Your progress has been saved. Please return to the lobby.
              </p>
              <button
                onClick={() => window.location.href = '/lobby'}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black">
          {children}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
