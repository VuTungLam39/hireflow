import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/** Log method, url, status và thời gian xử lý của mỗi request thành công */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const { method, originalUrl } = http.getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<Response>();
        this.logger.log(`${method} ${originalUrl} ${statusCode} - ${Date.now() - start}ms`);
      }),
    );
  }
}
