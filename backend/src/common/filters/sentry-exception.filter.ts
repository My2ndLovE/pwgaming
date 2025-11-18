import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Sentry Exception Filter
 *
 * Captures all unhandled exceptions and sends them to Sentry
 * while still returning appropriate HTTP responses
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    // Determine status and message
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorDetails = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Capture exception in Sentry
    Sentry.withScope((scope) => {
      // Add request context
      scope.setContext('http', {
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
        body: request.body,
      });

      // Add user context if available
      if ((request as any).user) {
        scope.setUser({
          id: (request as any).user.id,
          username: (request as any).user.username,
          ip_address: request.ip,
        });
      }

      // Set tags
      scope.setTag('http_status', status);
      scope.setTag('http_method', request.method);
      scope.setTag('route', request.route?.path || request.url);

      // Only capture 5xx errors (server errors) in Sentry
      // Client errors (4xx) are expected and shouldn't flood Sentry
      if (status >= 500) {
        if (exception instanceof Error) {
          Sentry.captureException(exception);
        } else {
          Sentry.captureMessage(`HTTP ${status}: ${message}`);
        }
      }
    });

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
