import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../constants/index.js';
import type { Role } from '../enums/role.enum.js';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

/** Guard toàn cục: kiểm tra role khi route có @Roles(...) */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const user = context.switchToHttp().getRequest<Request>().user as AuthUser | undefined;
    return !!user && requiredRoles.includes(user.role);
  }
}
