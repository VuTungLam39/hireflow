import { HttpException, HttpStatus } from '@nestjs/common';
import type { FieldError } from '../interfaces/api-response.interface.js';
import type { ErrorCode } from './error-code.enum.js';

/**
 * Lỗi nghiệp vụ mà FE cần phân biệt bằng mã (Backend Architecture mục 11).
 * `errors` dùng khi lỗi gắn với một ô trong form, ví dụ email đã tồn tại.
 *
 * throw new BusinessException(ErrorCode.JobNotOpen, 'Job is not open', HttpStatus.CONFLICT)
 */
export class BusinessException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    errors?: FieldError[],
  ) {
    super({ code, message, ...(errors && { errors }) }, status);
  }
}
