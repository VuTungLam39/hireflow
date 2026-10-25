import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../constants/index.js';
import { CursorResult } from '../dto/cursor-result.dto.js';
import { PaginatedResult } from '../dto/paginated-result.dto.js';
import type { ApiResponse } from '../interfaces/api-response.interface.js';

/** Bọc mọi response thành công theo format chuẩn ApiResponse */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<unknown>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Success';
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) return data as never;
        const base = {
          success: true as const,
          statusCode: response.statusCode,
          message,
          timestamp: new Date().toISOString(),
        };
        if (data instanceof PaginatedResult || data instanceof CursorResult) {
          return { ...base, data: data.items, meta: data.meta };
        }
        return { ...base, data: data ?? null };
      }),
    );
  }
}
