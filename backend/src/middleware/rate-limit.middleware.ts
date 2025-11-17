import { Injectable } from '@nestjs/common';
import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export interface WebSocketRateLimitConfig {
  maxMessages: number;
  windowMs: number;
}

@Injectable()
export class RateLimitMiddleware {
  private readonly API_RATE_LIMIT = 100; // requests per minute
  private readonly WS_MESSAGE_LIMIT = 50; // messages per minute per user
  private readonly WINDOW_MS = 60000; // 1 minute

  /**
   * Gets rate limiter for API endpoints
   * 100 requests per minute per user/IP
   */
  getApiLimiter(): RateLimitRequestHandler {
    return rateLimit(this.getApiLimiterConfig());
  }

  /**
   * Gets API rate limiter configuration
   */
  getApiLimiterConfig(): Partial<Options> {
    return {
      windowMs: this.WINDOW_MS,
      max: this.API_RATE_LIMIT,
      message: {
        message: 'Too many requests from this IP/user, please try again later',
        statusCode: 429,
      },
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      skipFailedRequests: true, // Don't count failed requests
      skipSuccessfulRequests: false,
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise use IP
        const user = (req as any).user;
        return user?.userId ? `user:${user.userId}` : `ip:${req.ip}`;
      },
      handler: (req: Request, res: Response, next: NextFunction) => {
        res.status(429).json({
          message: 'Too many requests, please try again later',
          statusCode: 429,
          retryAfter: res.getHeader('Retry-After'),
        });
      },
    };
  }

  /**
   * Gets WebSocket rate limit configuration
   * 50 messages per minute per user
   */
  getWebSocketLimiter(): WebSocketRateLimitConfig {
    return {
      maxMessages: this.WS_MESSAGE_LIMIT,
      windowMs: this.WINDOW_MS,
    };
  }
}
