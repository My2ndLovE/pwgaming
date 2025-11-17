'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DepositFormProps {
  onSubmit: (amount: number, notes?: string) => Promise<void> | void;
  isLoading: boolean;
}

export function DepositForm({ onSubmit, isLoading }: DepositFormProps) {
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

    try {
      await onSubmit(amountNum, notes || undefined);
      setAmount('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_submit_deposit'));
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">{t('deposit_funds')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('amount')}
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('enter_amount')}
          required
          disabled={isLoading}
          error={error}
        />

        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            {t('notes_optional')}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('add_deposit_note')}
            disabled={isLoading}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t('submitting') : t('submit_deposit')}
        </Button>
      </form>
    </Card>
  );
}
