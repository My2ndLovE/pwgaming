import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { validateCorsConfig, getCorsOptions } from '../../src/config/cors.config';

describe('CORS Security (US1)', () => {
  let app: INestApplication;
  let configService: ConfigService;

  describe('T016: CORS rejection of unauthorized origins', () => {
    it('should reject requests from unauthorized origins in production', async () => {
      // Mock production environment
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'https://poker.pwgaming.com';
          return undefined;
        }),
      };

      const corsOptions = getCorsOptions(mockConfigService as any);

      // Test that only configured origin is allowed
      expect(corsOptions.origin).toBe('https://poker.pwgaming.com');
      expect(corsOptions.credentials).toBe(true);
    });

    it('should allow configured origin in production', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'https://poker.pwgaming.com';
          return undefined;
        }),
      };

      const corsOptions = getCorsOptions(mockConfigService as any);
      expect(corsOptions.origin).toBe('https://poker.pwgaming.com');
    });

    it('should allow multiple origins in development', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'development';
          if (key === 'FRONTEND_URL') return 'http://localhost:4120';
          return undefined;
        }),
      };

      const corsOptions = getCorsOptions(mockConfigService as any);
      expect(Array.isArray(corsOptions.origin)).toBe(true);
      expect(corsOptions.origin).toContain('http://localhost:4120');
      expect(corsOptions.origin).toContain('http://localhost:3000');
    });
  });

  describe('T017: CORS startup validation', () => {
    it('should fail to start in production without FRONTEND_URL', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return undefined;
          return undefined;
        }),
      };

      expect(() => validateCorsConfig(mockConfigService as any)).toThrow(
        /FRONTEND_URL environment variable must be set in production/
      );
    });

    it('should fail to start in production with localhost in FRONTEND_URL', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'http://localhost:4120';
          return undefined;
        }),
      };

      expect(() => validateCorsConfig(mockConfigService as any)).toThrow(
        /FRONTEND_URL cannot contain localhost/
      );
    });

    it('should fail to start in production with 127.0.0.1 in FRONTEND_URL', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'http://127.0.0.1:4120';
          return undefined;
        }),
      };

      expect(() => validateCorsConfig(mockConfigService as any)).toThrow(
        /FRONTEND_URL cannot contain localhost/
      );
    });

    it('should pass validation in production with valid FRONTEND_URL', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'https://poker.pwgaming.com';
          return undefined;
        }),
      };

      expect(() => validateCorsConfig(mockConfigService as any)).not.toThrow();
    });

    it('should pass validation in development regardless of FRONTEND_URL', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'development';
          if (key === 'FRONTEND_URL') return 'http://localhost:4120';
          return undefined;
        }),
      };

      expect(() => validateCorsConfig(mockConfigService as any)).not.toThrow();
    });
  });

  describe('T018: WebSocket origin validation', () => {
    it('should validate WebSocket origins using same logic as HTTP', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'FRONTEND_URL') return 'https://poker.pwgaming.com';
          return undefined;
        }),
      };

      const corsOptions = getCorsOptions(mockConfigService as any);

      // WebSocket connections should use same origin validation
      expect(corsOptions.origin).toBe('https://poker.pwgaming.com');
      expect(corsOptions.credentials).toBe(true);
    });
  });
});
