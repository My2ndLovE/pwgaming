/**
 * Authentication types for the poker platform
 */

export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
  isPremium: boolean;
  isBot: boolean;
  role: UserRole;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export enum UserRole {
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
