import type { SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import {
  applyCandidateScope,
  applyDepartmentScope,
  applyInterviewerScope,
} from './department-scope.js';

const fakeQb = () => {
  const qb = { andWhere: vi.fn(() => qb) };
  return qb as unknown as SelectQueryBuilder<object> & { andWhere: ReturnType<typeof vi.fn> };
};

describe.each([
  ['applyDepartmentScope', applyDepartmentScope, 'job.departmentId'],
  ['applyCandidateScope', applyCandidateScope, 'candidate.id'],
] as const)('%s', (_name, apply, column) => {
  it.each([Role.Admin, Role.Hr])('leaves the query untouched for %s', (role) => {
    const qb = fakeQb();
    apply(qb, { role, departmentId: null }, column);
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('limits a hiring manager to their department', () => {
    const qb = fakeQb();
    apply(qb, { role: Role.HiringManager, departmentId: 'd-1' }, column);
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining(column), {
      scopeDepartmentId: 'd-1',
    });
  });

  it('returns nothing for a hiring manager without a department', () => {
    const qb = fakeQb();
    apply(qb, { role: Role.HiringManager, departmentId: null }, column);
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });
});

describe('interviewer scope (BR-INT-02)', () => {
  it.each([
    ['applyDepartmentScope', applyDepartmentScope],
    ['applyCandidateScope', applyCandidateScope],
  ] as const)('%s returns nothing unless the caller names an assigned column', (_n, apply) => {
    const qb = fakeQb();
    apply(qb, { id: 'u-1', role: Role.Interviewer, departmentId: null }, 'x');
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });

  it.each([
    ['applicationIdColumn', '"app"."id"', '"scope_iv"."application_id" = "app"."id"'],
    ['jobIdColumn', '"job"."id"', '"scope_ja"."job_id" = "job"."id"'],
    ['cvFileIdColumn', '"cv"."id"', '"scope_fa"."cv_file_id" = "cv"."id"'],
  ] as const)('limits to assigned, not cancelled interviews by %s', (key, column, expected) => {
    const qb = fakeQb();
    applyDepartmentScope(qb, { id: 'u-1', role: Role.Interviewer, departmentId: null }, 'x', {
      [key]: column,
    });
    const [sql, params] = qb.andWhere.mock.calls[0] as unknown as [string, object];
    expect(sql).toContain(expected);
    expect(sql).toContain(`"scope_iv"."status" <> 'CANCELLED'`);
    expect(params).toEqual({ scopeUserId: 'u-1' });
  });

  it('returns nothing for an interviewer without an id', () => {
    const qb = fakeQb();
    applyInterviewerScope(
      qb,
      { role: Role.Interviewer, departmentId: null },
      {
        applicationIdColumn: '"app"."id"',
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });
});
