/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth hook
jest.mock('@/hooks/use-auth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('LoginPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

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
  });

  it('should render the login page title', () => {
    render(<LoginPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/welcome/i);
  });

  it('should render platform description', () => {
    render(<LoginPage />);

    const description = screen.getByText(/texas hold'em poker/i);
    expect(description).toBeInTheDocument();
  });

  it('should render Telegram login button', () => {
    render(<LoginPage />);

    const loginButton = screen.getByRole('button', { name: /telegram/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should redirect when already authenticated', () => {
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
        accessToken: 'token',
        refreshToken: 'refresh',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(<LoginPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
