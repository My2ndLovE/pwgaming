import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store: RateLimitStore = {};
  private readonly ttl: number;
  private readonly max: number;

  constructor(private readonly configService: ConfigService) {
    this.ttl = this.configService.get<number>('rateLimit.ttl') || 60;
    this.max = this.configService.get<number>('rateLimit.max') || 100;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getKey(request);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetAt < now) {
      this.store[key] = {
        count: 1,
        resetAt: now + this.ttl * 1000,
      };
      return true;
    }

    this.store[key].count++;

    if (this.store[key].count > this.max) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((this.store[key].resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getKey(request: Request): string {
    // Use IP address or user ID if authenticated
    const userId = (request as any).user?.id;
    return userId || request.ip || 'anonymous';
  }
}
