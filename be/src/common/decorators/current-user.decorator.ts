import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

/** Lấy user hiện tại (hoặc 1 field của user) từ request */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;
    return field ? user?.[field] : user;
  },
);
