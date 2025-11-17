import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'poker_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',

  // CONNECTION POOLING OPTIMIZATION
  extra: {
    max: 20, // Maximum connections
    min: 5, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // 2s connection timeout
    query_timeout: 10000, // 10s query timeout
    statement_timeout: 10000, // 10s statement timeout

    // Connection pool behavior
    evictionRunIntervalMillis: 10000, // Check every 10s
    numTestsPerRun: 3,
    softIdleTimeoutMillis: 20000,

    // Performance tuning
    application_name: 'poker_platform',
  },

  // QUERY PERFORMANCE
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    duration: 30000, // Cache for 30 seconds
  },

  // Enable query result streaming for large datasets
  maxQueryExecutionTime: 1000, // Log slow queries > 1s
});
