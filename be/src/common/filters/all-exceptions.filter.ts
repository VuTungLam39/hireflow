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
import type { ApiErrorResponse } from '../interfaces/api-response.interface.js';

// Mã lỗi PostgreSQL thường gặp
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

/** Bắt mọi exception và trả về format lỗi thống nhất */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const body = res as { message?: string | string[]; errors?: unknown };
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = body.message;
        } else {
          message = body.message ?? exception.message;
          errors = body.errors;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code?: string } | undefined)?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource already exists';
      } else if (code === PG_FOREIGN_KEY_VIOLATION) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Related resource not found';
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors !== undefined && { errors }),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }
}
