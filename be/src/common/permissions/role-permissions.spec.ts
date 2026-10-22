import { Role } from '../enums/role.enum.js';
import { Permission } from './permission.enum.js';
import { hasPermission, ROLE_PERMISSIONS } from './role-permissions.js';

describe('ROLE_PERMISSIONS (kickoff 11.1)', () => {
  it('gives admin every permission', () => {
    expect([...ROLE_PERMISSIONS[Role.Admin]].sort()).toEqual(Object.values(Permission).sort());
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
