'use client';

import { useState } from 'react';
import { CreditCardIcon, BanknoteIcon, HistoryIcon } from 'lucide-react';
import AdminCreditForm from '@/components/admin/wallet/admin-credit-form';
import AdminDebitForm from '@/components/admin/wallet/admin-debit-form';
import WalletModeStatus from '@/components/admin/wallet/wallet-mode-status';
import TransactionHistory from '@/components/admin/wallet/transaction-history';

export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState<'credit' | 'debit' | 'history'>('credit');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-gray-600">
          Manual wallet operations for admin users. All transactions are logged with admin ID and reason.
        </p>
      </div>

      {/* Wallet Mode Status */}
      <WalletModeStatus />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('credit')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
            activeTab === 'credit'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <CreditCardIcon className="h-5 w-5" />
          Credit User
        </button>
        <button
          onClick={() => setActiveTab('debit')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
            activeTab === 'debit'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <BanknoteIcon className="h-5 w-5" />
          Debit User
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <HistoryIcon className="h-5 w-5" />
          Transaction History
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'credit' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Credit User Balance</h2>
            <p className="text-sm text-gray-600 mb-6">
              Add funds to a user's wallet. Use for promotional bonuses, bug compensation, or payment gateway recovery.
            </p>
            <AdminCreditForm />
          </div>
        )}

        {activeTab === 'debit' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debit User Balance</h2>
            <p className="text-sm text-gray-600 mb-6">
              Deduct funds from a user's wallet. Use for penalties, disputed transaction reversals, or balance corrections.
            </p>
            <AdminDebitForm />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Transaction History</h2>
            <p className="text-sm text-gray-600 mb-6">
              View all manual credit/debit transactions performed by admins.
            </p>
            <TransactionHistory />
          </div>
        )}
      </div>
    </div>
  );
}
