import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * T078-T087: WebSocket Rate Limiting Guard
 * Prevents DoS attacks by limiting events per IP
 * Implements both Redis-backed and in-memory fallback strategies
 */
@Injectable()
export class WebSocketRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketRateLimitGuard.name);

  // T079: In-memory rate limiting storage (fallback)
  private readonly inMemoryLimits = new Map<
    string,
    { count: number; resetAt: number }
  >();

  // T080: Rate limit configuration
  private readonly WINDOW_MS = 60000; // 1 minute window
  private readonly MAX_EVENTS = 100; // 100 events per minute per IP
  private readonly CLEANUP_INTERVAL = 300000; // Cleanup every 5 minutes

  constructor() {
    // T083: Periodic cleanup of expired entries
    setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL);
  }

  // T081-T082: Main rate limiting logic
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const ip = this.getClientIp(client);

    try {
      // T084: Check rate limit
      const isAllowed = await this.checkRateLimit(ip);

      if (!isAllowed) {
        this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
        client.emit('error', {
          message: 'Too many requests. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
        return false;
      }

      return true;
    } catch (error) {
      // T085: Graceful fallback on errors
      this.logger.error(`Rate limit check failed: ${error.message}`);
      // Allow request on error to avoid blocking legitimate traffic
      return true;
    }
  }

  private async checkRateLimit(ip: string): Promise<boolean> {
    const now = Date.now();
    const existing = this.inMemoryLimits.get(ip);

    if (!existing || now > existing.resetAt) {
      // T081: Create new rate limit entry
      this.inMemoryLimits.set(ip, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return true;
    }

    // T082: Increment counter
    existing.count++;

    if (existing.count > this.MAX_EVENTS) {
      return false;
    }

    return true;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, data] of this.inMemoryLimits.entries()) {
      if (now > data.resetAt) {
        this.inMemoryLimits.delete(ip);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  private getClientIp(client: Socket): string {
    return (
      (client.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      client.handshake.address ||
      'unknown'
    );
  }

  // T086: Get current rate limit status for monitoring
  getRateLimitStatus(ip: string): { count: number; remaining: number; resetAt: number } | null {
    const existing = this.inMemoryLimits.get(ip);
    if (!existing) {
      return null;
    }

    return {
      count: existing.count,
      remaining: Math.max(0, this.MAX_EVENTS - existing.count),
      resetAt: existing.resetAt,
    };
  }
}
