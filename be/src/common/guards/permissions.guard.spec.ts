import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum.js';
import { Permission } from '../permissions/permission.enum.js';
import { PermissionsGuard } from './permissions.guard.js';

const contextFor = (role: Role | null) =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  }) as unknown as ExecutionContext;

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector);
  const requires = (permissions?: Permission[]) =>
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);

  afterEach(() => vi.restoreAllMocks());

  it('allows routes without @Permissions (@Public, @Authenticated)', () => {
    requires(undefined);
    expect(guard.canActivate(contextFor(null))).toBe(true);
  });

  it.each([
    [Role.Admin, Permission.UserManage, true],
    [Role.Hr, Permission.UserManage, false],
    [Role.Hr, Permission.ApplicationUpdateStatus, true],
    [Role.HiringManager, Permission.ApplicationUpdateStatus, false],
    [Role.HiringManager, Permission.ApplicationApproveOffer, true],
  ])('%s → %s: %s', (role, permission, expected) => {
    requires([permission]);
    expect(guard.canActivate(contextFor(role))).toBe(expected);
  });

  it('requires every listed permission', () => {
    requires([Permission.JobRead, Permission.JobCreate]);
    expect(guard.canActivate(contextFor(Role.HiringManager))).toBe(false);
    expect(guard.canActivate(contextFor(Role.Hr))).toBe(true);
  });

  it('denies when no user is attached', () => {
    requires([Permission.JobRead]);
    expect(guard.canActivate(contextFor(null))).toBe(false);
  });
});
