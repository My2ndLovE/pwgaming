import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous';
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    this.logger.log(`[${userId}] ${method} ${url} - Transaction started`);

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.logger.log(
          `[${userId}] ${method} ${url} - Transaction completed in ${duration}ms`,
        );

        if (data?.id) {
          this.logger.log(`[${userId}] Transaction ID: ${data.id}`);
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.logger.error(
          `[${userId}] ${method} ${url} - Transaction failed in ${duration}ms: ${error.message}`,
        );
        throw error;
      }),
    );
  }
}
