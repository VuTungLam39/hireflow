import { ForbiddenException } from '@nestjs/common';
import type { SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import {
  applyCandidateScope,
  applyDepartmentScope,
  applyInterviewerScope,
  dataScope,
  inManagerScope,
  orgIdOf,
} from './department-scope.js';

const ORG = 'org-1';
const ORG_FILTER = ['org.col = :scopeOrgId', { scopeOrgId: ORG }];

const fakeQb = () => {
  const qb = { andWhere: vi.fn(() => qb) };
  return qb as unknown as SelectQueryBuilder<object> & { andWhere: ReturnType<typeof vi.fn> };
};

describe.each([
  ['applyDepartmentScope', applyDepartmentScope, 'job.departmentId'],
  ['applyCandidateScope', applyCandidateScope, 'candidate.id'],
] as const)('%s', (_name, apply, column) => {
  it.each([Role.Admin, Role.Hr])('only limits %s to their organization', (role) => {
    const qb = fakeQb();
    apply(qb, { role, departmentId: null, organizationId: ORG }, 'org.col', column);
    expect(qb.andWhere.mock.calls).toEqual([ORG_FILTER]);
  });

  it('limits a hiring manager to their organization, then their department', () => {
    const qb = fakeQb();
    apply(
      qb,
      { role: Role.HiringManager, departmentId: 'd-1', organizationId: ORG },
      'org.col',
      column,
    );
    expect(qb.andWhere.mock.calls[0]).toEqual(ORG_FILTER);
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining(column), {
      scopeDepartmentId: 'd-1',
    });
  });

  it('returns nothing for a hiring manager without a department', () => {
    const qb = fakeQb();
    apply(
      qb,
      { role: Role.HiringManager, departmentId: null, organizationId: ORG },
      'org.col',
      column,
    );
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });

  it('MVP 3.1 · BR-JOB-12: a hiring manager also sees jobs assigned to them, still inside the organization', () => {
    const qb = fakeQb();
    apply(
      qb,
      { id: 'u-hm', role: Role.HiringManager, departmentId: 'd-1', organizationId: ORG },
      'org.col',
      column,
    );
    expect(qb.andWhere.mock.calls[0]).toEqual(ORG_FILTER);
    const [sql, params] = qb.andWhere.mock.calls[1] as [string, object];
    expect(sql).toMatch(/ OR /);
    expect(sql).toMatch(/hiring_?[mM]anager_?[iI]d/);
    expect(params).toEqual({ scopeDepartmentId: 'd-1', scopeManagerId: 'u-hm' });
  });

  it('BR-JOB-12: a hiring manager without a department sees only assigned jobs', () => {
    const qb = fakeQb();
    apply(
      qb,
      { id: 'u-hm', role: Role.HiringManager, departmentId: null, organizationId: ORG },
      'org.col',
      column,
    );
    const [sql] = qb.andWhere.mock.calls[1] as [string];
    expect(sql).not.toMatch(/department/i);
    expect(sql).toMatch(/hiring_?[mM]anager_?[iI]d/);
  });

  it('refuses a user without an organization (BR-TEN-01)', () => {
    const qb = fakeQb();
    expect(() =>
      apply(qb, { role: Role.Admin, departmentId: null, organizationId: null }, 'org.col', column),
    ).toThrow(ForbiddenException);
  });
});

describe('interviewer scope (BR-INT-02)', () => {
  const interviewer = {
    id: 'u-1',
    role: Role.Interviewer,
    departmentId: null,
    organizationId: ORG,
  };

  it.each([
    ['applyDepartmentScope', applyDepartmentScope],
    ['applyCandidateScope', applyCandidateScope],
  ] as const)('%s returns nothing unless the caller names an assigned column', (_n, apply) => {
    const qb = fakeQb();
    apply(qb, interviewer, 'org.col', 'x');
    expect(qb.andWhere.mock.calls[0]).toEqual(ORG_FILTER);
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });

  it.each([
    ['applicationIdColumn', '"app"."id"', '"scope_iv"."application_id" = "app"."id"'],
    ['jobIdColumn', '"job"."id"', '"scope_ja"."job_id" = "job"."id"'],
    ['cvFileIdColumn', '"cv"."id"', '"scope_fa"."cv_file_id" = "cv"."id"'],
  ] as const)('limits to assigned, not cancelled interviews by %s', (key, column, expected) => {
    const qb = fakeQb();
    applyDepartmentScope(qb, interviewer, 'org.col', 'x', { [key]: column });
    expect(qb.andWhere.mock.calls[0]).toEqual(ORG_FILTER);
    const [sql, params] = qb.andWhere.mock.calls[1] as unknown as [string, object];
    expect(sql).toContain(expected);
    expect(sql).toContain(`"scope_iv"."status" <> 'CANCELLED'`);
    expect(params).toEqual({ scopeUserId: 'u-1' });
  });

  it('returns nothing for an interviewer without an id', () => {
    const qb = fakeQb();
    applyInterviewerScope(
      qb,
      { role: Role.Interviewer, departmentId: null, organizationId: ORG },
      { applicationIdColumn: '"app"."id"' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });
});

describe('dataScope (BR-ACC-07, BR-INT-02)', () => {
  it.each([
    [Role.Admin, 'all'],
    [Role.Hr, 'all'],
    [Role.HiringManager, 'department'],
    [Role.Interviewer, 'assigned'],
  ] as const)('classifies %s as %s', (role, scope) => {
    expect(dataScope(role)).toBe(scope);
  });

  it('refuses a role without a scope instead of opening the query', () => {
    const qb = fakeQb();
    const user = { role: 'viewer' as Role, departmentId: null, organizationId: ORG };
    expect(() => dataScope(user.role)).toThrow('Role has no data scope');
    expect(() => applyDepartmentScope(qb, user, 'org.col', 'job.departmentId')).toThrow();
    expect(() => applyCandidateScope(qb, user, 'org.col', 'candidate.id')).toThrow();
    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});

describe('orgIdOf (BR-TEN-01)', () => {
  it('returns the organization of the user', () => {
    expect(orgIdOf({ organizationId: ORG })).toBe(ORG);
  });

  it('refuses a user without an organization', () => {
    expect(() => orgIdOf({ organizationId: null })).toThrow(ForbiddenException);
  });
});

describe('inManagerScope (BR-JOB-12)', () => {
  const hm = { id: 'u-hm', role: Role.HiringManager, departmentId: 'd-1', organizationId: ORG };
  it.each([
    [{ departmentId: 'd-1', hiringManagerId: null }, true],
    [{ departmentId: 'd-2', hiringManagerId: 'u-hm' }, true],
    [{ departmentId: 'd-2', hiringManagerId: 'u-other' }, false],
    [{ departmentId: 'd-2' }, false],
  ])('job %o → %s', (job, expected) => {
    expect(inManagerScope(hm, job)).toBe(expected);
  });

  it('applyDepartmentScope refuses a column that is not <alias>.departmentId', () => {
    expect(() => applyDepartmentScope(fakeQb(), hm, 'org.col', 'dep.id')).toThrow();
  });
});
