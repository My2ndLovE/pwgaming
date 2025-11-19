import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { initializeSentry, Sentry } from './config/sentry.config';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { validateCorsConfig, getCorsOptions } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Validate CORS configuration (T019-T021: CRITICAL - fails fast in production)
  validateCorsConfig(configService);

  // Initialize Sentry (must be first)
  initializeSentry(configService);

  // Add Sentry request handler
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration (T022: Apply validated CORS options)
  app.enableCors(getCorsOptions(configService));

  // Compression
  app.use(compression());

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Sentry error handler (must be before other error handlers)
  app.use(Sentry.Handlers.errorHandler());

  // Global exception filter for Sentry
  app.useGlobalFilters(new SentryExceptionFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
