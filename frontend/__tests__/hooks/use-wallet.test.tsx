import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '@/hooks/use-wallet';
import { walletApi } from '@/lib/api/wallet';
import { useAuth } from '@/hooks/use-auth';
import { tokenStorage } from '@/lib/token-storage';

jest.mock('@/lib/api/wallet');
jest.mock('@/hooks/use-auth');
jest.mock('@/lib/token-storage');

const mockWalletApi = walletApi as jest.Mocked<typeof walletApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

describe('useWallet Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', telegramId: 123 },
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
    });
    mockTokenStorage.getAccessToken.mockReturnValue('mock-token');

    // Default mocks to prevent errors on mount
    mockWalletApi.getBalance.mockResolvedValue({ balance: 0 });
    mockWalletApi.getTransactions.mockResolvedValue({
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useWallet());

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.balance).toBe(0);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch balance on mount', async () => {
    mockWalletApi.getBalance.mockResolvedValue({ balance: 1000 });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.balance).toBe(1000);
    });

    expect(mockWalletApi.getBalance).toHaveBeenCalled();
  });

  it('should fetch transactions on mount', async () => {
    const mockTransactions = [
      {
        id: '1',
        type: 'deposit' as const,
        amount: 500,
        status: 'completed' as const,
        createdAt: '2025-01-15T10:00:00Z',
      },
    ];

    mockWalletApi.getBalance.mockResolvedValue({ balance: 500 });
    mockWalletApi.getTransactions.mockResolvedValue({
      transactions: mockTransactions,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.transactions).toEqual(mockTransactions);
    });

    expect(mockWalletApi.getTransactions).toHaveBeenCalled();
  });

  it('should handle deposit submission', async () => {
    const mockResponse = {
      message: 'Deposit request created',
      transaction: {
        id: '2',
        amount: 500,
        status: 'pending',
        createdAt: '2025-01-15T10:00:00Z',
      },
    };

    mockWalletApi.getBalance.mockResolvedValue({ balance: 0 });
    mockWalletApi.getTransactions.mockResolvedValue({
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mockWalletApi.submitDeposit.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.submitDeposit(500);
    });

    expect(mockWalletApi.submitDeposit).toHaveBeenCalledWith(
      expect.any(String),
      500,
      undefined
    );
  });

  it('should handle withdrawal submission', async () => {
    const mockResponse = {
      message: 'Withdrawal request created',
      transaction: {
        id: '3',
        amount: 200,
        status: 'pending',
        createdAt: '2025-01-15T11:00:00Z',
      },
    };

    mockWalletApi.getBalance.mockResolvedValue({ balance: 1000 });
    mockWalletApi.getTransactions.mockResolvedValue({
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mockWalletApi.submitWithdrawal.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.balance).toBe(1000);
    });

    await act(async () => {
      await result.current.submitWithdrawal(200);
    });

    expect(mockWalletApi.submitWithdrawal).toHaveBeenCalledWith(
      expect.any(String),
      200,
      undefined
    );
  });

  it('should handle errors when fetching balance', async () => {
    mockWalletApi.getBalance.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should refresh data', async () => {
    mockWalletApi.getBalance.mockResolvedValue({ balance: 1500 });
    mockWalletApi.getTransactions.mockResolvedValue({
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.balance).toBe(1500);
    });

    mockWalletApi.getBalance.mockResolvedValue({ balance: 2000 });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.balance).toBe(2000);
    });

    expect(mockWalletApi.getBalance).toHaveBeenCalledTimes(2);
  });
});
