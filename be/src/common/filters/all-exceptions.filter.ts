import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '../exceptions/error-code.enum.js';
import type { ApiErrorResponse } from '../interfaces/api-response.interface.js';
import { REQUEST_ID_HEADER } from '../middleware/request-id.js';
import { safeUrl } from '../utils/safe-url.js';

// Mã lỗi PostgreSQL thường gặp
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

const ERROR_CODES = new Set<string>(Object.values(ErrorCode));

/**
 * Mã mặc định khi exception không mang sẵn mã (Backend Architecture mục 11).
 * Mọi lỗi 400 chung đều là VALIDATION_FAILED vì API Contract mục 5 không có mã BAD_REQUEST.
 */
export function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.Unauthorized;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.Forbidden;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NotFound;
    case HttpStatus.CONFLICT:
      return ErrorCode.Conflict;
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return ErrorCode.FileTooLarge;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.TooManyRequests;
    default:
      return status >= 500 ? ErrorCode.InternalError : ErrorCode.ValidationFailed;
  }
}

/** Bắt mọi exception và trả về format lỗi thống nhất (API Contract mục 1.3) */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: ErrorCode | undefined;
    let errors: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const body = res as { code?: unknown; message?: string | string[]; errors?: unknown };
        if (typeof body.code === 'string' && ERROR_CODES.has(body.code)) {
          code = body.code as ErrorCode;
        }
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = body.message;
        } else {
          message = body.message ?? exception.message;
          errors = body.errors;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      const pgCode = (exception.driverError as { code?: string } | undefined)?.code;
      if (pgCode === PG_UNIQUE_VIOLATION) {
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      } else if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Related resource not found';
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `[${request.headers[REQUEST_ID_HEADER] as string}] ${request.method} ${safeUrl(request.originalUrl)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      code: code ?? codeForStatus(statusCode),
      message,
      ...(errors !== undefined && { errors }),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }
}
