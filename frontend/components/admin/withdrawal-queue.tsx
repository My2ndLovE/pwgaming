'use client';

import { useState } from 'react';
import { PendingWithdrawal } from '@/lib/api/admin-withdrawals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, User, Calendar, DollarSign } from 'lucide-react';

interface WithdrawalQueueProps {
  withdrawals: PendingWithdrawal[];
  onApprove: (withdrawalId: string) => Promise<void>;
  onReject: (withdrawalId: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

export function WithdrawalQueue({
  withdrawals,
  onApprove,
  onReject,
  isLoading,
}: WithdrawalQueueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

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

  const handleApprove = async (withdrawalId: string) => {
    if (window.confirm('Are you sure you want to approve this withdrawal?')) {
      await onApprove(withdrawalId);
    }
  };

  const handleRejectClick = (withdrawalId: string) => {
    setSelectedId(withdrawalId);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const handleRejectSubmit = async () => {
    if (!selectedId || !rejectReason.trim()) return;

    await onReject(selectedId, rejectReason);
    setShowRejectModal(false);
    setSelectedId(null);
    setRejectReason('');
  };

  if (withdrawals.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No pending withdrawals</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawals.map((withdrawal) => (
        <Card key={withdrawal.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{withdrawal.username}</span>
                <span className="text-sm text-muted-foreground">
                  (ID: {withdrawal.userId})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {formatAmount(withdrawal.amount)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(withdrawal.createdAt)}</span>
              </div>

              {withdrawal.notes && (
                <div className="mt-2 rounded-md bg-muted p-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {withdrawal.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(withdrawal.id)}
                disabled={isLoading}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRejectClick(withdrawal.id)}
                disabled={isLoading}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">Reject Withdrawal</h3>
            <div className="mb-4">
              <label
                htmlFor="reject-reason"
                className="mb-2 block text-sm font-medium"
              >
                Reason for Rejection
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isLoading}
              >
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedId(null);
                  setRejectReason('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
