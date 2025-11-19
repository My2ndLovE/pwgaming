import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Validates CORS configuration for production environment
 * Throws error if FRONTEND_URL is not set or contains localhost in production
 *
 * @param configService - NestJS ConfigService instance
 * @throws Error if validation fails
 */
export function validateCorsConfig(configService: ConfigService): void {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (nodeEnv === 'production') {
    if (!frontendUrl) {
      throw new Error(
        'FATAL: FRONTEND_URL environment variable must be set in production mode. ' +
        'This is required for CORS security. ' +
        'Example: FRONTEND_URL=https://poker.pwgaming.com'
      );
    }

    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
      throw new Error(
        'FATAL: FRONTEND_URL cannot contain localhost or 127.0.0.1 in production mode. ' +
        'Current value: ' + frontendUrl + '. ' +
        'Use your production domain instead.'
      );
    }
  }
}

/**
 * Returns CORS options based on environment
 * Production: Only allows configured FRONTEND_URL
 * Development: Allows FRONTEND_URL plus localhost variants
 *
 * @param configService - NestJS ConfigService instance
 * @returns CorsOptions for express
 */
export function getCorsOptions(configService: ConfigService): CorsOptions {
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const nodeEnv = configService.get<string>('NODE_ENV');

  return {
    origin: nodeEnv === 'production'
      ? frontendUrl  // Production: exact match only
      : [frontendUrl, 'http://localhost:4120', 'http://localhost:3000'], // Dev: allow localhost
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  };
}
