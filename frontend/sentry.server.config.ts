import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust this value in production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console
    debug: ENVIRONMENT === 'development',

    // Filter out expected errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (ENVIRONMENT === 'development') {
        console.log('[Sentry] Server error captured:', hint.originalException);
        return null;
      }

      return event;
    },
  });

  console.log(`[Sentry] Server initialized for environment: ${ENVIRONMENT}`);
} else {
  console.log('[Sentry] No DSN provided, skipping server initialization');
}
