'use client';

import { useAdminWithdrawals } from '@/hooks/use-admin-withdrawals';
import { WithdrawalQueue } from '@/components/admin/withdrawal-queue';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const {
    withdrawals,
    isLoading,
    error,
    approveWithdrawal,
    rejectWithdrawal,
    refresh,
  } = useAdminWithdrawals();

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pending Withdrawals</h1>
            <p className="text-muted-foreground">
              Review and process withdrawal requests
            </p>
          </div>
          <Button onClick={refresh} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading && withdrawals.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading withdrawals..." />
          </div>
        ) : (
          <WithdrawalQueue
            withdrawals={withdrawals}
            onApprove={approveWithdrawal}
            onReject={rejectWithdrawal}
            isLoading={isLoading}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
