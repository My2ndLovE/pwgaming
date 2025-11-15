/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

// Mock the auth hook
jest.mock('@/hooks/use-auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  it('should redirect to /login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
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
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not redirect when loading finishes with authenticated user', async () => {
    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Start with loading state
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Finish loading with authenticated user
    mockUseAuth.mockReturnValue({
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
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to /login when auth error occurs', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Session expired',
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
