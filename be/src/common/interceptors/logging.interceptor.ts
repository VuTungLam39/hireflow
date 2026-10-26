import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REQUEST_ID_HEADER } from '../middleware/request-id.js';
import { safeUrl } from '../utils/safe-url.js';

/** Log request id, method, url, status và thời gian xử lý của mỗi request thành công */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const { method, originalUrl, headers } = http.getRequest<Request>();
    const id = headers[REQUEST_ID_HEADER] as string | undefined;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<Response>();
        this.logger.log(
          `[${id}] ${method} ${safeUrl(originalUrl)} ${statusCode} - ${Date.now() - start}ms`,
        );
      }),
    );
  }
}
