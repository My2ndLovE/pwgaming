'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1F2937',
          color: '#F9FAFB',
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#F9FAFB',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#F9FAFB',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#F9FAFB',
          },
        },
      }}
    />
  );
}
