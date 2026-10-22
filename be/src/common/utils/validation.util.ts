import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { ErrorCode } from '../exceptions/error-code.enum.js';
import type { FieldError } from '../interfaces/api-response.interface.js';

/** Làm phẳng lỗi validate lồng nhau thành [{ field: 'a.b', messages: [...] }] */
const flatten = (errors: ValidationError[], parent = ''): FieldError[] =>
  errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });

export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: ErrorCode.ValidationFailed,
        message: 'Validation failed',
        errors: flatten(errors),
      }),
  });
