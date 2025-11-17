'use client';

import { useEffect, useState } from 'react';
import { ServerIcon, CheckCircleIcon } from 'lucide-react';

interface WalletModeStatus {
  mode: string;
  features: string[];
}

export default function WalletModeStatus() {
  const [status, setStatus] = useState<WalletModeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletMode();
  }, []);

  const fetchWalletMode = async () => {
    try {
      const response = await fetch('/api/admin/wallet/mode');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch wallet mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
    );
  }

  if (!status) return null;

  const isInternal = status.mode === 'internal';

  return (
    <div
      className={`rounded-lg p-6 mb-6 ${
        isInternal ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <ServerIcon className={`h-6 w-6 mt-1 ${isInternal ? 'text-blue-600' : 'text-green-600'}`} />
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            Current Mode: <span className="uppercase">{status.mode}</span>
          </h3>
          <ul className="space-y-1">
            {status.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircleIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isInternal ? 'text-blue-500' : 'text-green-500'}`} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {isInternal && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> In internal mode, all deposits are processed manually via admin credit.
                This mode is suitable for MVP testing and early launch before payment gateway integration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
