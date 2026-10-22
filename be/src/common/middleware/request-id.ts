import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/** Tên header viết thường, vì Express lưu header request ở dạng chữ thường */
export const REQUEST_ID_HEADER = 'x-request-id';

// Chỉ nhận id do client gửi khi đủ an toàn để ghi vào log
const VALID_ID = /^[\w-]{1,64}$/;

/**
 * Gắn một id cho mỗi request để nối log từ HTTP tới job trong queue (Backend Architecture 15.2).
 * Dùng lại id client gửi lên nếu hợp lệ, không thì tạo mới; trả lại trong header X-Request-Id.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  req.headers[REQUEST_ID_HEADER] = id;
  res.setHeader('X-Request-Id', id);
  next();
}
