'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletApi, Transaction } from '@/lib/api/wallet';
import { useAuth } from './use-auth';
import { tokenStorage } from '@/lib/token-storage';

interface UseWalletReturn {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  submitDeposit: (amount: number, notes?: string) => Promise<void>;
  submitWithdrawal: (amount: number, notes?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!user) return;

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        walletApi.getBalance(token),
        walletApi.getTransactions(token, 1, 20),
      ]);

      setBalance(balanceRes.balance);
      setTransactions(transactionsRes.transactions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const submitDeposit = useCallback(
    async (amount: number, notes?: string) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await walletApi.submitDeposit(token, amount, notes);
        await fetchWalletData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit deposit';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWalletData]
  );

  const submitWithdrawal = useCallback(
    async (amount: number, notes?: string) => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await walletApi.submitWithdrawal(token, amount, notes);
        await fetchWalletData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit withdrawal';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWalletData]
  );

  const refresh = useCallback(async () => {
    await fetchWalletData();
  }, [fetchWalletData]);

  return {
    balance,
    transactions,
    isLoading,
    error,
    submitDeposit,
    submitWithdrawal,
    refresh,
  };
}
