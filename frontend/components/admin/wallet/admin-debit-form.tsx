'use client';

import { useState } from 'react';
import { UserMinusIcon } from 'lucide-react';

export default function AdminDebitForm() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/wallet/debit/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), reason }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: `Successfully debited ${amount} from user ${userId}` });
        setUserId('');
        setAmount('');
        setReason('');
      } else {
        setResult({ success: false, message: data.message || 'Failed to debit user' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="debit-userId" className="block text-sm font-medium mb-1">
          User ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="debit-userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user UUID"
          required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="debit-amount" className="block text-sm font-medium mb-1">
          Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="debit-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="debit-reason" className="block text-sm font-medium mb-1">
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="debit-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Penalty for rule violation"
          required
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Required for audit trail. Common reasons: Penalty, Disputed transaction reversal, Balance correction
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Warning:</strong> Debiting will fail if the user has insufficient balance. Always verify balance before debiting.
        </p>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
      >
        <UserMinusIcon className="h-5 w-5" />
        {loading ? 'Processing...' : 'Debit User'}
      </button>
    </form>
  );
}
