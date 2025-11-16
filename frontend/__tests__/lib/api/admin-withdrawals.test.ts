import { adminWithdrawalsApi } from '@/lib/api/admin-withdrawals';

describe('Admin Withdrawals API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getPendingWithdrawals', () => {
    it('should fetch pending withdrawals successfully', async () => {
      const mockWithdrawals = {
        withdrawals: [
          {
            id: '1',
            userId: 'user1',
            username: 'testuser',
            amount: 500,
            status: 'pending',
            createdAt: '2025-01-15T10:00:00Z',
            notes: 'Test withdrawal',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWithdrawals,
      });

      const result = await adminWithdrawalsApi.getPendingWithdrawals('mock-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/admin/withdrawals',
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockWithdrawals);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(
        adminWithdrawalsApi.getPendingWithdrawals('mock-token')
      ).rejects.toThrow();
    });
  });

  describe('approveWithdrawal', () => {
    it('should approve withdrawal successfully', async () => {
      const mockResponse = {
        message: 'Withdrawal approved successfully',
        transaction: {
          id: '1',
          status: 'completed',
          processedAt: '2025-01-15T11:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adminWithdrawalsApi.approveWithdrawal(
        'mock-token',
        '1'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/admin/withdrawals/1/approve',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rejectWithdrawal', () => {
    it('should reject withdrawal with reason', async () => {
      const mockResponse = {
        message: 'Withdrawal rejected successfully',
        transaction: {
          id: '1',
          status: 'rejected',
          processedAt: '2025-01-15T11:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adminWithdrawalsApi.rejectWithdrawal(
        'mock-token',
        '1',
        'Insufficient verification'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4110/admin/withdrawals/1/reject',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify({ reason: 'Insufficient verification' }),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
