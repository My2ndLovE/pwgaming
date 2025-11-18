'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Oops!</h1>
          <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#666', marginBottom: '32px', textAlign: 'center', maxWidth: '400px' }}>
            We apologize for the inconvenience. Our team has been notified and is working on a fix.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
        {/* <NextError statusCode={undefined as any} /> */}
      </body>
    </html>
  );
}
