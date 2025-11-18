import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum WalletMode {
  Manual = 'manual',
  Auto = 'auto',
}

/**
 * Environment Variables Schema
 *
 * This class defines all required and optional environment variables
 * with validation rules. The application will fail fast on startup
 * if any required variables are missing or invalid.
 */
class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  PORT: number = 3001;

  // Database (PostgreSQL)
  @IsString()
  @IsOptional()
  DB_HOST?: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT?: number = 5432;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_DATABASE!: string;

  // Alternative database env vars (for Azure/Docker compatibility)
  @IsString()
  @IsOptional()
  DATABASE_HOST?: string;

  @IsNumber()
  @IsOptional()
  DATABASE_PORT?: number;

  @IsString()
  @IsOptional()
  DATABASE_USER?: string;

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DATABASE_NAME?: string;

  // Redis
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  REDIS_DB: number = 0;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  // Security
  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRATION: string = '7d';

  // Telegram
  @IsString()
  @MinLength(10)
  TELEGRAM_BOT_TOKEN!: string;

  // Frontend
  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS?: string = 'http://localhost:3000';

  // Wallet Configuration
  @IsEnum(WalletMode)
  @IsOptional()
  WALLET_MODE?: WalletMode = WalletMode.Manual;

  // Rate Limiting
  @IsNumber()
  @Min(1)
  @Max(10000)
  @IsOptional()
  RATE_LIMIT_MAX?: number = 100;

  @IsNumber()
  @Min(1000)
  @Max(3600000)
  @IsOptional()
  RATE_LIMIT_TTL?: number = 60000;

  // Monitoring (optional)
  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  APPLICATIONINSIGHTS_CONNECTION_STRING?: string;
}

/**
 * Validates environment variables on application startup
 *
 * This function ensures all required environment variables are present
 * and valid before the application starts. Invalid configuration will
 * cause the application to exit immediately with detailed error messages.
 *
 * @param config - Raw environment variables from process.env
 * @returns Validated and typed environment configuration
 * @throws Error if validation fails with detailed error messages
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = Object.values(error.constraints || {});
      return `  - ${error.property}: ${constraints.join(', ')}`;
    });

    const errorMessage = [
      '\n',
      '='.repeat(80),
      '  ENVIRONMENT CONFIGURATION ERROR',
      '='.repeat(80),
      '',
      '  The following environment variables are invalid or missing:',
      '',
      ...errorMessages,
      '',
      '  Please check your .env file and ensure all required variables are set.',
      '  See .env.example for reference.',
      '',
      '='.repeat(80),
      '\n',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return validatedConfig;
}

// Export enums for use in other modules
export { Environment, WalletMode, EnvironmentVariables };
