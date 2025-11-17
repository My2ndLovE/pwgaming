/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

import type { AuthResponse, AuthTokens, User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4110';

class AuthClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthClientError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new AuthClientError(
      error.message || 'Request failed',
      response.status,
      error.code
    );
  }

  return response.json();
}

export const authClient = {
  /**
   * Authenticate user with Telegram initData
   */
  async login(initData: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    return handleResponse<AuthResponse>(response);
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    return handleResponse<AuthTokens>(response);
  },

  /**
   * Get current user profile
   */
  async getProfile(accessToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleResponse<User>(response);
  },
};
