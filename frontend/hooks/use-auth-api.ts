import { useState } from 'react';
import apiClient, { setTokens, clearTokens, getRefreshToken } from '@/lib/api/auth-interceptor';

export interface User {
  id: string;
  username: string;
  balance: number;
  role: string;
  avatarUrl?: string;
  status?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

export function useAuthApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login with Telegram
   */
  const loginWithTelegram = async (initData: string): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/telegram', {
        initData,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      setTokens(accessToken, refreshToken);

      setLoading(false);
      return user;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      return null;
    }
  };

  /**
   * Get current user profile
   */
  const getProfile = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<User>('/auth/me');
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      setLoading(false);
      return null;
    }
  };

  /**
   * Logout (revoke current refresh token)
   */
  const logout = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }

      clearTokens();
      setLoading(false);
      return true;
    } catch (err: any) {
      // Even if API call fails, clear local tokens
      clearTokens();
      setError(err.response?.data?.message || 'Logout failed');
      setLoading(false);
      return false;
    }
  };

  /**
   * Logout from all devices
   */
  const logoutAll = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/logout-all');
      clearTokens();
      setLoading(false);
      return true;
    } catch (err: any) {
      // Even if API call fails, clear local tokens
      clearTokens();
      setError(err.response?.data?.message || 'Logout failed');
      setLoading(false);
      return false;
    }
  };

  return {
    loginWithTelegram,
    getProfile,
    logout,
    logoutAll,
    loading,
    error,
  };
}
