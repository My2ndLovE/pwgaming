import { Controller, Get, HttpStatus } from '@nestjs/common';
import { HealthService } from '../services/health.service';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Check if the server is running (for Kubernetes liveness probe)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Server is alive',
    schema: {
      example: {
        status: 'ok',
        details: {
          uptime: 123.456,
          timestamp: '2025-01-15T12:00:00.000Z',
          environment: 'production',
          version: '1.0.0',
        },
      },
    },
  })
  async checkLiveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Check if the server is ready to accept traffic (for Kubernetes readiness probe)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Server is ready',
    schema: {
      example: {
        status: 'ok',
        details: {
          database: { status: 'up', type: 'postgres', responseTime: 'fast' },
          redis: { status: 'up', type: 'redis', responseTime: '5ms' },
          memory: {
            status: 'ok',
            usage: { rss: 150, heapTotal: 80, heapUsed: 60, external: 10 },
            unit: 'MB',
          },
          timestamp: '2025-01-15T12:00:00.000Z',
          uptime: 123.456,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Server is not ready (dependencies down)',
    schema: {
      example: {
        status: 'error',
        details: {
          database: {
            status: 'down',
            type: 'postgres',
            error: 'Connection refused',
          },
          redis: { status: 'up', type: 'redis', responseTime: '5ms' },
        },
        error: {
          database: {
            status: 'down',
            type: 'postgres',
            error: 'Connection refused',
          },
        },
      },
    },
  })
  async checkReadiness() {
    const result = await this.healthService.checkReadiness();

    if (result.status === 'error') {
      // Return 503 if any dependencies are down
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        ...result,
      };
    }

    return result;
  }

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Combined health check',
    description: 'Comprehensive health check using @nestjs/terminus',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All health checks passed',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more health checks failed',
  })
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      async () => {
        const redisHealthy = await this.healthService.checkRedisConnection();
        return {
          redis: {
            status: redisHealthy ? 'up' : 'down',
          },
        };
      },
    ]);
  }

  @Get('info')
  @ApiOperation({
    summary: 'System information',
    description: 'Get system information and resource usage',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System information retrieved',
    schema: {
      example: {
        platform: 'linux',
        arch: 'x64',
        nodeVersion: 'v18.17.0',
        uptime: 123.456,
        memory: {
          rss: 150,
          heapTotal: 80,
          heapUsed: 60,
          external: 10,
          unit: 'MB',
        },
        cpu: {
          user: 123456,
          system: 78910,
          unit: 'microseconds',
        },
        environment: 'production',
        timestamp: '2025-01-15T12:00:00.000Z',
      },
    },
  })
  async getInfo() {
    return this.healthService.getSystemInfo();
  }
}
