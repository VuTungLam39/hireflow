import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { REQUEST_ID_HEADER } from '../middleware/request-id.js';

export interface RequestContext {
  requestId?: string;
  ip?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const currentRequest = (): RequestContext => storage.getStore() ?? {};

// F-AUDIT-01: ghi IP người thao tác
export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  storage.run(
    { requestId: req.header(REQUEST_ID_HEADER) ?? undefined, ip: req.ip ?? undefined },
    () => next(),
  );
}
