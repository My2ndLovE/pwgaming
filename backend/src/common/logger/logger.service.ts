import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as pino from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }

  /**
   * Log with correlation ID for distributed tracing
   */
  logWithCorrelation(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    correlationId: string,
    meta?: Record<string, any>
  ) {
    this.logger[level]({ correlationId, ...meta }, message);
  }

  /**
   * Get child logger with additional context
   */
  child(bindings: pino.Bindings): LoggerService {
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }

  /**
   * Get the underlying pino logger
   */
  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}
