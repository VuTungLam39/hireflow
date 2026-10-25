import type { ErrorCode } from '../exceptions/error-code.enum.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

/** Lỗi gắn với một field của request body, để FE hiện đúng ô form */
export interface FieldError {
  field: string;
  messages: string[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  /** Luôn có (API Contract mục 1.3). FE hiển thị câu tiếng Việt theo mã này */
  code: ErrorCode;
  /** Câu tiếng Anh ngắn, chỉ cho dev đọc */
  message: string;
  errors?: unknown;
  path: string;
  timestamp: string;
}
