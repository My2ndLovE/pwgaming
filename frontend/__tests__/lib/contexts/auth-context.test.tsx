/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/contexts/auth-context';
import { authClient } from '@/lib/api/auth-client';
import { tokenStorage } from '@/lib/token-storage';
import type { AuthResponse } from '@/types';

// Mock dependencies
jest.mock('@/lib/api/auth-client');
jest.mock('@/lib/token-storage');

const mockAuthClient = authClient as jest.Mocked<typeof authClient>;
const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

// Test component that uses auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('mock-init-data');
    } catch (err) {
      // Error is handled by context
    }
  };

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial unauthenticated state', () => {
    mockTokenStorage.getTokens.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should handle successful login', async () => {
    mockTokenStorage.getTokens.mockReturnValue(null);

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
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    };

    mockAuthClient.login.mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');

    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    expect(mockAuthClient.login).toHaveBeenCalledWith('mock-init-data');
    expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(
      mockResponse.tokens
    );
  });

  it('should handle login failure', async () => {
    mockTokenStorage.getTokens.mockReturnValue(null);
    mockAuthClient.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');

    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Invalid credentials'
      );
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should handle logout', async () => {
    mockTokenStorage.getTokens.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    mockAuthClient.getProfile.mockResolvedValue({
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
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    const logoutButton = screen.getByText('Logout');

    await act(async () => {
      logoutButton.click();
    });

    expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('should restore session from stored tokens on mount', async () => {
    mockTokenStorage.getTokens.mockReturnValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    mockAuthClient.getProfile.mockResolvedValue({
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
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    expect(mockAuthClient.getProfile).toHaveBeenCalledWith('access-token');
  });
});
