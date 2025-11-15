/**
 * Auth API Client Tests
 * RED phase - Tests for authentication API client
 */

import { authClient } from '@/lib/api/auth-client';
import type { AuthResponse, User } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthClient', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('login', () => {
    it('should send Telegram initData to /auth/telegram endpoint', async () => {
      const mockResponse: AuthResponse = {
        user: {
          id: '1',
          telegramId: 123456,
          username: 'testuser',
          firstName: 'Test',
          isPremium: false,
          isBot: false,
          role: 'PLAYER' as any,
          isActive: true,
          isSuspended: false,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const initData = 'mock-telegram-init-data';
      const result = await authClient.login(initData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when login fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      } as Response);

      await expect(authClient.login('invalid-data')).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should send refresh token to /auth/refresh endpoint', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const refreshToken = 'mock-refresh-token';
      const result = await authClient.refreshToken(refreshToken);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should send GET request with authorization header', async () => {
      const mockUser: User = {
        id: '1',
        telegramId: 123456,
        username: 'testuser',
        firstName: 'Test',
        isPremium: false,
        isBot: false,
        role: 'PLAYER' as any,
        isActive: true,
        isSuspended: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const accessToken = 'mock-access-token';
      const result = await authClient.getProfile(accessToken);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw error when unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(authClient.getProfile('invalid-token')).rejects.toThrow();
    });
  });
});
