'use client';

import { Transaction } from '@/lib/api/wallet';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getStatusColor = (status: Transaction['status']): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-orange-600" />;
      case 'game_win':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'game_loss':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (): string => {
    switch (transaction.type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'game_win':
        return 'Game Win';
      case 'game_loss':
        return 'Game Loss';
      default:
        return transaction.type;
    }
  };

  return (
    <div className="flex items-center justify-between border-b py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-muted p-2">{getTypeIcon()}</div>
        <div>
          <p className="font-medium">{getTypeLabel()}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(transaction.createdAt)}
          </p>
          {transaction.notes && (
            <p className="mt-1 text-xs text-muted-foreground">
              {transaction.notes}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatAmount(transaction.amount)}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
            transaction.status
          )}`}
        >
          {transaction.status.charAt(0).toUpperCase() +
            transaction.status.slice(1)}
        </span>
      </div>
    </div>
  );
}
