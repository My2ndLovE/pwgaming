import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../../../src/modules/health/services/health.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_DB: 0,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLiveness', () => {
    it('should return ok status with system details', async () => {
      const result = await service.checkLiveness();

      expect(result.status).toBe('ok');
      expect(result.details).toBeDefined();
      expect(result.details.uptime).toBeDefined();
      expect(result.details.timestamp).toBeDefined();
      expect(result.details.environment).toBeDefined();
      expect(result.details.version).toBeDefined();
    });

    it('should include current timestamp', async () => {
      const beforeCall = new Date();
      const result = await service.checkLiveness();
      const afterCall = new Date();

      const resultTimestamp = new Date(result.details.timestamp);
      expect(resultTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(resultTimestamp.getTime()).toBeLessThanOrEqual(
        afterCall.getTime(),
      );
    });

    it('should include process uptime', async () => {
      const result = await service.checkLiveness();

      expect(typeof result.details.uptime).toBe('number');
      expect(result.details.uptime).toBeGreaterThan(0);
    });
  });

  describe('checkReadiness', () => {
    it('should return error status when database is down', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection refused'));

      const result = await service.checkReadiness();

      expect(result.status).toBe('error');
      expect(result.details.database.status).toBe('down');
      expect(result.details.database.error).toBe('Connection refused');
      expect(result.error).toBeDefined();
      expect(result.error.database).toBeDefined();
    });

    it('should include memory usage information', async () => {
      mockDataSource.query.mockResolvedValue([{ health: 1 }]);

      const result = await service.checkReadiness();

      expect(result.details.memory).toBeDefined();
      expect(result.details.memory.status).toBe('ok');
      expect(result.details.memory.usage).toBeDefined();
      expect(result.details.memory.usage.rss).toBeGreaterThan(0);
      expect(result.details.memory.usage.heapUsed).toBeGreaterThan(0);
      expect(result.details.memory.unit).toBe('MB');
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return true when database is connected', async () => {
      mockDataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await service.checkDatabaseConnection();

      expect(result).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return false when database connection fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection error'));

      const result = await service.checkDatabaseConnection();

      expect(result).toBe(false);
    });
  });

  describe('checkRedisConnection', () => {
    it('should return a boolean value', async () => {
      const result = await service.checkRedisConnection();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', async () => {
      const result = await service.getSystemInfo();

      expect(result.platform).toBeDefined();
      expect(result.arch).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.memory).toBeDefined();
      expect(result.cpu).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should include memory usage in MB', async () => {
      const result = await service.getSystemInfo();

      expect(result.memory.unit).toBe('MB');
      expect(result.memory.rss).toBeGreaterThan(0);
      expect(result.memory.heapTotal).toBeGreaterThan(0);
      expect(result.memory.heapUsed).toBeGreaterThan(0);
    });

    it('should include CPU usage', async () => {
      const result = await service.getSystemInfo();

      expect(result.cpu.unit).toBe('microseconds');
      expect(typeof result.cpu.user).toBe('number');
      expect(typeof result.cpu.system).toBe('number');
    });
  });
});
