import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitMiddleware } from '../../../src/middleware/rate-limit.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitMiddleware],
    }).compile();

    middleware = module.get<RateLimitMiddleware>(RateLimitMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('getApiLimiter', () => {
    it('should return rate limiter for API endpoints', () => {
      const limiter = middleware.getApiLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('getWebSocketLimiter', () => {
    it('should return rate limiter configuration for WebSocket', () => {
      const config = middleware.getWebSocketLimiter();
      expect(config).toBeDefined();
      expect(config.maxMessages).toBe(50);
      expect(config.windowMs).toBe(60000); // 1 minute
    });
  });

  describe('Configuration', () => {
    it('should have API rate limit of 100 requests per minute', () => {
      const config = middleware.getApiLimiterConfig();
      expect(config.max).toBe(100);
      expect(config.windowMs).toBe(60000);
    });

    it('should skip failed requests', () => {
      const config = middleware.getApiLimiterConfig();
      expect(config.skipFailedRequests).toBe(true);
    });

    it('should skip successful requests from counting', () => {
      const config = middleware.getApiLimiterConfig();
      expect(config.skipSuccessfulRequests).toBe(false);
    });
  });

  describe('Rate limit exceeded response', () => {
    it('should return 429 status with proper message', () => {
      const config = middleware.getApiLimiterConfig();
      const mockReq = {} as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        getHeader: jest.fn().mockReturnValue('60'),
      } as unknown as Response;

      if (config.handler) {
        config.handler(mockReq, mockRes, {} as NextFunction);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Too many requests'),
        })
      );
    });
  });

  describe('Key generation', () => {
    it('should use user ID for authenticated requests', () => {
      const config = middleware.getApiLimiterConfig();
      const mockReq = {
        user: { userId: 'user123' },
        ip: '127.0.0.1',
      } as unknown as Request;

      const key = config.keyGenerator?.(mockReq, {} as Response);
      expect(key).toContain('user123');
    });

    it('should use IP for unauthenticated requests', () => {
      const config = middleware.getApiLimiterConfig();
      const mockReq = {
        ip: '127.0.0.1',
      } as unknown as Request;

      const key = config.keyGenerator?.(mockReq, {} as Response);
      expect(key).toContain('127.0.0.1');
    });
  });
});
