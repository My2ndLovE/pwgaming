'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('wallet');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t('amount_greater_than_zero'));
      return;
    }

    if (amountNum > maxAmount) {
      setError(t('amount_exceeds_balance'));
      return;
    }

    try {
      await onSubmit(amountNum, notes || undefined);
      setAmount('');
      setNotes('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('failed_submit_withdrawal')
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
        <h2 className="text-lg font-semibold">{t('withdraw_funds')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('available')}: {formatAmount(maxAmount)}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('amount')}
          type="number"
          step="0.01"
          min="0"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('enter_amount')}
          required
          disabled={isLoading}
          error={error}
        />

        <div>
          <label htmlFor="withdrawal-notes" className="mb-2 block text-sm font-medium">
            {t('notes_optional')}
          </label>
          <textarea
            id="withdrawal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('add_withdrawal_note')}
            disabled={isLoading}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button type="submit" disabled={isLoading || maxAmount === 0} className="w-full">
          {isLoading ? t('submitting') : t('submit_withdrawal')}
        </Button>
      </form>
    </Card>
  );
}
