import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { REQUEST_ID_HEADER } from '../middleware/request-id.js';

// Backend Architecture 15.2
export const RequestId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined =>
    ctx.switchToHttp().getRequest<Request>().header(REQUEST_ID_HEADER),
);
