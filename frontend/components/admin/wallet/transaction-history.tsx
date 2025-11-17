'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  processedBy: string;
  processedAt: string;
  notes: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // TODO: Implement backend endpoint for admin transaction history
      // const response = await fetch('/api/admin/wallet/transactions');
      // const data = await response.json();
      // setTransactions(data.transactions);

      // Mock data for now
      setTransactions([]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No admin transactions yet.</p>
        <p className="text-sm mt-2">Credit or debit operations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium">User ID</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Balance Before</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Balance After</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Processed By</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {tx.type === 'admin_credit' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      tx.type === 'admin_credit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'admin_credit' ? 'Credit' : 'Debit'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{tx.userId.substring(0, 8)}...</td>
              <td className="px-4 py-3 text-right font-semibold">${tx.amount.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-gray-600">${tx.balanceBefore.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-gray-600">${tx.balanceAfter.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tx.notes}</td>
              <td className="px-4 py-3 font-mono text-xs">{tx.processedBy.substring(0, 8)}...</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {new Date(tx.processedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
