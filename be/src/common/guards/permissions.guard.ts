import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../constants/index.js';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';
import type { Permission } from '../permissions/permission.enum.js';
import { hasPermission } from '../permissions/role-permissions.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<Request>().user as AuthUser | undefined;
    return !!user && required.every((p) => hasPermission(user.role, p));
  }
}
