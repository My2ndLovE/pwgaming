/**
 * Authentication Context
 * Manages global authentication state
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User, AuthTokens, AuthContextType } from '@/types';
import { authClient } from '@/lib/api/auth-client';
import { tokenStorage } from '@/lib/token-storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = tokenStorage.getTokens();

        if (storedTokens) {
          // Restore session from stored tokens
          const profile = await authClient.getProfile(storedTokens.accessToken);
          setUser(profile);
          setTokens(storedTokens);
        }
      } catch (err) {
        // Token invalid or expired, clear storage
        tokenStorage.clearTokens();
        setUser(null);
        setTokens(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (initData: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authClient.login(initData);

      setUser(response.user);
      setTokens(response.tokens);
      tokenStorage.saveTokens(response.tokens);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    setError(null);
    tokenStorage.clearTokens();
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const currentRefreshToken = tokenStorage.getRefreshToken();

      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await authClient.refreshToken(currentRefreshToken);

      setTokens(newTokens);
      tokenStorage.saveTokens(newTokens);

      // Fetch updated profile with new access token
      const profile = await authClient.getProfile(newTokens.accessToken);
      setUser(profile);
    } catch (err) {
      // Refresh failed, logout user
      logout();
      throw err;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
