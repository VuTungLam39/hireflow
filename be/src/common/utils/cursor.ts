import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception.js';
import { ErrorCode } from '../exceptions/error-code.enum.js';

export interface CursorPosition {
  createdAt: Date;
  id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parse = (cursor: string): { c?: unknown; i?: unknown } | null => {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
};

// Database Design D2, Q2
export const encodeCursor = ({ createdAt, id }: CursorPosition) =>
  Buffer.from(JSON.stringify({ c: createdAt.toISOString(), i: id })).toString('base64url');

export function decodeCursor(cursor: string): CursorPosition {
  const value = parse(cursor);
  const createdAt = new Date(String(value?.c));
  if (
    typeof value?.c === 'string' &&
    typeof value.i === 'string' &&
    UUID.test(value.i) &&
    !isNaN(createdAt.getTime())
  ) {
    return { createdAt, id: value.i };
  }
  throw new BusinessException(
    ErrorCode.ValidationFailed,
    'Invalid cursor',
    HttpStatus.BAD_REQUEST,
    [{ field: 'cursor', messages: ['Cursor không hợp lệ'] }],
  );
}
