'use client';

import { Card } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

export function BalanceCard({
  balance,
  pendingDeposits,
  pendingWithdrawals,
}: BalanceCardProps) {
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      role="region"
      aria-label="Wallet balance information"
      className="space-y-4"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold">{formatAmount(balance)}</p>
            </div>
          </div>
        </div>

        {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
          <div className="mt-6 grid gap-3 border-t pt-4 sm:grid-cols-2">
            {pendingDeposits > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pending Deposits
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatAmount(pendingDeposits)}
                  </p>
                </div>
              </div>
            )}

            {pendingWithdrawals > 0 && (
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Pending Withdrawals
                  </p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatAmount(pendingWithdrawals)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
