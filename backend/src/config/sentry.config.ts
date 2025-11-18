import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

export function initializeSentry(configService: ConfigService) {
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.log('[Sentry] No DSN provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app: undefined }),
      // Enable profiling
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (environment === 'development') {
        console.log('[Sentry] Error captured:', hint.originalException);
        return null; // Don't send to Sentry in development
      }

      // Filter out specific error types
      const error = hint.originalException;

      if (error instanceof Error) {
        // Don't send validation errors to Sentry (too noisy)
        if (error.message.includes('ValidationError')) {
          return null;
        }

        // Don't send 404 errors
        if (error.message.includes('Not Found')) {
          return null;
        }
      }

      return event;
    },
  });

  console.log(`[Sentry] Initialized for environment: ${environment}`);
}

export { Sentry };
