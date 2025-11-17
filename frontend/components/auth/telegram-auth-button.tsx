/**
 * Telegram Auth Button Component
 * Handles Telegram Mini App authentication
 */

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { useAuth } from '@/hooks/use-auth';

export function TelegramAuthButton() {
  const { t } = useTranslation('auth');
  const { isAuthenticated, isLoading, error, login } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLocalError(null);

      // Get Telegram initData from SDK
      let initDataRaw: string | undefined;

      try {
        const launchParams = retrieveLaunchParams();
        initDataRaw = launchParams.initDataRaw as string | undefined;
      } catch (sdkError) {
        // SDK not available or not in Telegram environment
        setLocalError(t('not_telegram_env'));
        return;
      }

      if (!initDataRaw || typeof initDataRaw !== 'string') {
        setLocalError(t('not_telegram_env'));
        return;
      }

      await login(initDataRaw);
    } catch (err) {
      // Error is already handled by auth context
      console.error('Login failed:', err);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled
          className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t('already_authenticated')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('authenticating')}
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.03-.74 4.04-1.76 6.73-2.92 8.08-3.49 3.85-1.62 4.65-1.9 5.17-1.91.11 0 .37.03.54.17.14.11.18.26.2.37.02.06.05.24.03.37z" />
            </svg>
            {t('login')}
          </>
        )}
      </button>

      {/* Error Messages */}
      {(error || localError) && (
        <div className="text-sm text-red-400 text-center">
          {error || localError}
        </div>
      )}
    </div>
  );
}
