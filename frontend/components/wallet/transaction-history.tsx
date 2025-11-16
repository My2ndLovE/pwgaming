'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/api/wallet';
import { TransactionCard } from './transaction-card';
import { Card } from '@/components/ui/card';
import { FileX } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('deposit')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'deposit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setFilter('withdrawal')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === 'withdrawal'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Withdrawals
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No transactions found
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
