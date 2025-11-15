/**
 * Login Page
 * Entry point for user authentication via Telegram
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TelegramAuthButton } from '@/components/auth/telegram-auth-button';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-gray-700">
      <div className="text-center space-y-6">
        {/* Logo/Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Welcome to PW Gaming
          </h1>
          <p className="text-gray-300 text-lg">
            Play Texas Hold'em Poker with friends
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3 py-4">
          <p className="text-gray-400">
            Join thousands of players in exciting poker games
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>✓ Real-time multiplayer gameplay</li>
            <li>✓ Secure wallet management</li>
            <li>✓ Fair and transparent games</li>
          </ul>
        </div>

        {/* Login Button */}
        <div className="pt-4">
          <TelegramAuthButton />
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 pt-4">
          By logging in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
