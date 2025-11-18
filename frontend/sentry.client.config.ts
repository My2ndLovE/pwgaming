import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: ENVIRONMENT === 'development',

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out expected errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Don't send errors in development
      if (ENVIRONMENT === 'development') {
        console.log('[Sentry] Error captured:', error);
        return null;
      }

      // Filter out network errors (handled by user notification)
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          return null;
        }

        if (error.message.includes('timeout')) {
          return null;
        }
      }

      return event;
    },
  });

  console.log(`[Sentry] Client initialized for environment: ${ENVIRONMENT}`);
} else {
  console.log('[Sentry] No DSN provided, skipping client initialization');
}
