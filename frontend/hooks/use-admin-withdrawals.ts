'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminWithdrawalsApi, PendingWithdrawal } from '@/lib/api/admin-withdrawals';
import { useAuth } from './use-auth';
import { tokenStorage } from '@/lib/token-storage';

interface UseAdminWithdrawalsReturn {
  withdrawals: PendingWithdrawal[];
  isLoading: boolean;
  error: string | null;
  approveWithdrawal: (withdrawalId: string) => Promise<void>;
  rejectWithdrawal: (withdrawalId: string, reason: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAdminWithdrawals(): UseAdminWithdrawalsReturn {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    if (!user) return;

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminWithdrawalsApi.getPendingWithdrawals(token);
      setWithdrawals(response.withdrawals);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch pending withdrawals';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const approveWithdrawal = useCallback(
    async (withdrawalId: string) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await adminWithdrawalsApi.approveWithdrawal(token, withdrawalId);
        await fetchWithdrawals();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to approve withdrawal';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithdrawals]
  );

  const rejectWithdrawal = useCallback(
    async (withdrawalId: string, reason: string) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await adminWithdrawalsApi.rejectWithdrawal(token, withdrawalId, reason);
        await fetchWithdrawals();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to reject withdrawal';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithdrawals]
  );

  const refresh = useCallback(async () => {
    await fetchWithdrawals();
  }, [fetchWithdrawals]);

  return {
    withdrawals,
    isLoading,
    error,
    approveWithdrawal,
    rejectWithdrawal,
    refresh,
  };
}
