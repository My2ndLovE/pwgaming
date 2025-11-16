import { walletApi } from '@/lib/api/wallet';

describe('Wallet API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getBalance', () => {
    it('should fetch user balance successfully', async () => {
      const mockBalance = { balance: 1000 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalance,
      });

      const result = await walletApi.getBalance('mock-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/wallet/balance',
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockBalance);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(walletApi.getBalance('mock-token')).rejects.toThrow();
    });
  });

  describe('getTransactions', () => {
    it('should fetch transaction history with pagination', async () => {
      const mockTransactions = {
        transactions: [
          {
            id: '1',
            type: 'deposit',
            amount: 500,
            status: 'completed',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      });

      const result = await walletApi.getTransactions('mock-token', 1, 20);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/wallet/transactions?page=1&limit=20',
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('submitDeposit', () => {
    it('should submit deposit request successfully', async () => {
      const mockResponse = {
        message: 'Deposit request created. Awaiting admin approval.',
        transaction: {
          id: '1',
          amount: 500,
          status: 'pending',
          createdAt: '2025-01-15T10:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await walletApi.submitDeposit('mock-token', 500);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/wallet/deposit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ amount: 500 }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include notes when provided', async () => {
      const mockResponse = {
        message: 'Deposit request created.',
        transaction: { id: '1', amount: 500, status: 'pending' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await walletApi.submitDeposit('mock-token', 500, 'Test deposit');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/wallet/deposit',
        expect.objectContaining({
          body: JSON.stringify({ amount: 500, notes: 'Test deposit' }),
        })
      );
    });
  });

  describe('submitWithdrawal', () => {
    it('should submit withdrawal request successfully', async () => {
      const mockResponse = {
        message: 'Withdrawal request created. Awaiting admin approval.',
        transaction: {
          id: '2',
          amount: 200,
          status: 'pending',
          createdAt: '2025-01-15T11:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await walletApi.submitWithdrawal('mock-token', 200);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/wallet/withdraw',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ amount: 200 }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle insufficient balance error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Insufficient balance' }),
      });

      await expect(walletApi.submitWithdrawal('mock-token', 1000)).rejects.toThrow();
    });
  });
});
