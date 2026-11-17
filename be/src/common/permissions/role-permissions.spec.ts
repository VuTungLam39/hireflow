import { Role } from '../enums/role.enum.js';
import { Permission } from './permission.enum.js';
import { hasPermission, ROLE_PERMISSIONS } from './role-permissions.js';

describe('ROLE_PERMISSIONS (kickoff 11.1)', () => {
  // KH MVP 3 mục 4: bẫy bảo mật, Admin công ty không được duyệt công ty khác
  it('gives admin every permission except platform:manage', () => {
    expect([...ROLE_PERMISSIONS[Role.Admin]].sort()).toEqual(
      Object.values(Permission)
        .filter((p) => p !== Permission.PlatformManage)
        .sort(),
    );
  });

  it('BR-TEN-04: the platform admin only manages the platform, and nobody else does', () => {
    expect(ROLE_PERMISSIONS[Role.PlatformAdmin]).toEqual([Permission.PlatformManage]);
    for (const role of Object.values(Role).filter((r) => r !== Role.PlatformAdmin)) {
      expect(hasPermission(role, Permission.PlatformManage)).toBe(false);
    }
  });

  it.each([
    [Role.Hr, Permission.UserManage, false],
    [Role.Hr, Permission.DepartmentManage, false],
    [Role.Hr, Permission.CandidateAnonymize, false],
    [Role.Hr, Permission.ApplicationApproveOffer, false],
    [Role.Hr, Permission.ApplicationCreate, true],
    [Role.Hr, Permission.AiRescore, true],
    [Role.HiringManager, Permission.ApplicationApproveOffer, true],
    [Role.HiringManager, Permission.ApplicationUpdateStatus, false],
    [Role.HiringManager, Permission.JobCreate, false],
    [Role.HiringManager, Permission.CandidateUpdate, false],
    [Role.HiringManager, Permission.AiRescore, false],
  ])('%s has %s: %s', (role, permission, expected) => {
    expect(hasPermission(role, permission)).toBe(expected);
  });

  it('has no duplicates', () => {
    for (const list of Object.values(ROLE_PERMISSIONS)) {
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
