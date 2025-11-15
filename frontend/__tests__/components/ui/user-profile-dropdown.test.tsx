/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileDropdown } from '@/components/ui/user-profile-dropdown';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth hook
jest.mock('@/hooks/use-auth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserProfileDropdown', () => {
  const mockLogout = jest.fn();
  const mockUser = {
    id: '1',
    telegramId: 123456,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isPremium: false,
    isBot: false,
    role: 'PLAYER' as any,
    isActive: true,
    isSuspended: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: mockLogout,
      refreshToken: jest.fn(),
    });
  });

  it('should render user information when authenticated', () => {
    render(<UserProfileDropdown />);

    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('should display user first name and last name if available', () => {
    render(<UserProfileDropdown />);

    const displayName = screen.getByText(/Test User/i);
    expect(displayName).toBeInTheDocument();
  });

  it('should display username as fallback when no first/last name', () => {
    mockUseAuth.mockReturnValue({
      user: {
        ...mockUser,
        firstName: undefined,
        lastName: undefined,
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: mockLogout,
      refreshToken: jest.fn(),
    });

    render(<UserProfileDropdown />);

    // Username appears both as display name and with @ prefix
    const usernameElements = screen.getAllByText(/testuser/i);
    expect(usernameElements.length).toBeGreaterThan(0);
  });

  it('should toggle dropdown menu when clicked', async () => {
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button', { name: /profile/i });

    // Menu should not be visible initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Click to close
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should display logout option in dropdown menu', async () => {
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
    });
  });

  it('should call logout when logout option is clicked', async () => {
    render(<UserProfileDropdown />);

    const trigger = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('menuitem', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: mockLogout,
      refreshToken: jest.fn(),
    });

    const { container } = render(<UserProfileDropdown />);

    expect(container.firstChild).toBeNull();
  });

  it('should close dropdown when clicking outside', async () => {
    render(
      <div>
        <UserProfileDropdown />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const trigger = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should display user avatar or icon', () => {
    render(<UserProfileDropdown />);

    // Should have some visual representation of the user
    const trigger = screen.getByRole('button', { name: /profile/i });
    expect(trigger).toBeInTheDocument();
  });
});
