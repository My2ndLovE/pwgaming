/**
 * Game layout
 * Protected layout for game-related pages
 */

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black">
        {children}
      </div>
    </ProtectedRoute>
  );
}
