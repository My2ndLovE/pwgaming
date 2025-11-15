/**
 * Token Storage Tests
 * RED phase - Tests for JWT token storage
 */

import { tokenStorage } from '@/lib/token-storage';
import type { AuthTokens } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('saveTokens', () => {
    it('should store tokens in localStorage', () => {
      const tokens: AuthTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      tokenStorage.saveTokens(tokens);

      expect(localStorageMock.getItem('accessToken')).toBe(
        tokens.accessToken
      );
      expect(localStorageMock.getItem('refreshToken')).toBe(
        tokens.refreshToken
      );
    });
  });

  describe('getTokens', () => {
    it('should retrieve tokens from localStorage', () => {
      const tokens: AuthTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      localStorageMock.setItem('accessToken', tokens.accessToken);
      localStorageMock.setItem('refreshToken', tokens.refreshToken);

      const retrieved = tokenStorage.getTokens();

      expect(retrieved).toEqual(tokens);
    });

    it('should return null when no tokens exist', () => {
      const retrieved = tokenStorage.getTokens();

      expect(retrieved).toBeNull();
    });

    it('should return null when only access token exists', () => {
      localStorageMock.setItem('accessToken', 'access-token-123');

      const retrieved = tokenStorage.getTokens();

      expect(retrieved).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens from localStorage', () => {
      localStorageMock.setItem('accessToken', 'access-token-123');
      localStorageMock.setItem('refreshToken', 'refresh-token-456');

      tokenStorage.clearTokens();

      expect(localStorageMock.getItem('accessToken')).toBeNull();
      expect(localStorageMock.getItem('refreshToken')).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return only the access token', () => {
      const token = 'access-token-123';
      localStorageMock.setItem('accessToken', token);

      const retrieved = tokenStorage.getAccessToken();

      expect(retrieved).toBe(token);
    });

    it('should return null when access token does not exist', () => {
      const retrieved = tokenStorage.getAccessToken();

      expect(retrieved).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return only the refresh token', () => {
      const token = 'refresh-token-456';
      localStorageMock.setItem('refreshToken', token);

      const retrieved = tokenStorage.getRefreshToken();

      expect(retrieved).toBe(token);
    });

    it('should return null when refresh token does not exist', () => {
      const retrieved = tokenStorage.getRefreshToken();

      expect(retrieved).toBeNull();
    });
  });
});
