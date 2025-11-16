'use client';

import { useWallet } from '@/hooks/use-wallet';
import { BalanceCard } from '@/components/wallet/balance-card';
import { DepositForm } from '@/components/wallet/deposit-form';
import { WithdrawalForm } from '@/components/wallet/withdrawal-form';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function WalletPage() {
  const {
    balance,
    transactions,
    isLoading,
    error,
    submitDeposit,
    submitWithdrawal,
    refresh,
  } = useWallet();

  // Calculate pending amounts from transactions
  const pendingDeposits = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDeposit = async (amount: number, notes?: string) => {
    await submitDeposit(amount, notes);
    await refresh();
  };

  const handleWithdrawal = async (amount: number, notes?: string) => {
    await submitWithdrawal(amount, notes);
    await refresh();
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your funds and view transaction history
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <BalanceCard
            balance={balance}
            pendingDeposits={pendingDeposits}
            pendingWithdrawals={pendingWithdrawals}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <DepositForm onSubmit={handleDeposit} isLoading={isLoading} />
            <WithdrawalForm
              onSubmit={handleWithdrawal}
              isLoading={isLoading}
              maxAmount={balance}
            />
          </div>

          {isLoading && transactions.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading transactions..." />
            </div>
          ) : (
            <TransactionHistory transactions={transactions} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
