'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WithdrawalFormProps {
  onSubmit: (amount: number, notes?: string) => Promise<void> | void;
  isLoading: boolean;
  maxAmount: number;
}

export function WithdrawalForm({
  onSubmit,
  isLoading,
  maxAmount,
}: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > maxAmount) {
      setError('Amount exceeds available balance');
      return;
    }

    try {
      await onSubmit(amountNum, notes || undefined);
      setAmount('');
      setNotes('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit withdrawal'
      );
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Withdraw Funds</h2>
        <p className="text-sm text-muted-foreground">
          Available: {formatAmount(maxAmount)}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
          disabled={isLoading}
          error={error}
        />

        <div>
          <label htmlFor="withdrawal-notes" className="mb-2 block text-sm font-medium">
            Notes (Optional)
          </label>
          <textarea
            id="withdrawal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note for this withdrawal"
            disabled={isLoading}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button type="submit" disabled={isLoading || maxAmount === 0} className="w-full">
          {isLoading ? 'Submitting...' : 'Submit Withdrawal'}
        </Button>
      </form>
    </Card>
  );
}
