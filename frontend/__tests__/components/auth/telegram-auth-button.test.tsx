/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TelegramAuthButton } from '@/components/auth/telegram-auth-button';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth hook
jest.mock('@/hooks/use-auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Telegram SDK
jest.mock('@telegram-apps/sdk', () => ({
  retrieveLaunchParams: jest.fn(),
  mockTelegramEnv: jest.fn(),
  isTelegramPlatform: jest.fn(),
}));

describe('TelegramAuthButton', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });
  });

  it('should render the Telegram login button', () => {
    render(<TelegramAuthButton />);

    const button = screen.getByRole('button', { name: /telegram/i });
    expect(button).toBeInTheDocument();
  });

  it('should show loading state when authenticating', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(<TelegramAuthButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it('should display error message when authentication fails', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Authentication failed',
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(<TelegramAuthButton />);

    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('should call login when button is clicked', async () => {
    const { retrieveLaunchParams } = require('@telegram-apps/sdk');
    retrieveLaunchParams.mockReturnValue({
      initDataRaw: 'mock-init-data-string',
    });

    render(<TelegramAuthButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('mock-init-data-string');
    });
  });

  it('should show error when Telegram initData is not available', async () => {
    const { retrieveLaunchParams } = require('@telegram-apps/sdk');
    retrieveLaunchParams.mockReturnValue({
      initDataRaw: undefined,
    });

    render(<TelegramAuthButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/not running in telegram/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should be disabled when already authenticated', () => {
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
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });

    render(<TelegramAuthButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/already authenticated/i)).toBeInTheDocument();
  });
});
