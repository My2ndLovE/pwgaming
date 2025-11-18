import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  info?: Record<string, any>;
  error?: Record<string, any>;
  details: Record<string, any>;
}

@Injectable()
export class HealthService {
  private redis: Redis;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async checkLiveness(): Promise<HealthCheckResult> {
    // Liveness check: just verify the server is running
    return {
      status: 'ok',
      details: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    const checks: Record<string, any> = {};
    let hasErrors = false;

    // Check PostgreSQL connection
    try {
      const result = await this.dataSource.query('SELECT 1 as health');
      checks.database = {
        status: 'up',
        type: 'postgres',
        responseTime: result ? 'fast' : 'slow',
      };
    } catch (error) {
      hasErrors = true;
      checks.database = {
        status: 'down',
        type: 'postgres',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check Redis connection
    try {
      const start = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - start;

      checks.redis = {
        status: 'up',
        type: 'redis',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      hasErrors = true;
      checks.redis = {
        status: 'down',
        type: 'redis',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    checks.memory = {
      status: 'ok',
      usage: memUsageMB,
      unit: 'MB',
    };

    return {
      status: hasErrors ? 'error' : 'ok',
      details: {
        ...checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      ...(hasErrors && {
        error: Object.entries(checks)
          .filter(([, value]: [string, any]) => value.status === 'down')
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      }),
    };
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async checkRedisConnection(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async getSystemInfo(): Promise<Record<string, any>> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        unit: 'MB',
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        unit: 'microseconds',
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
