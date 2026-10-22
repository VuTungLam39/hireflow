import type { SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import { applyCandidateScope, applyDepartmentScope } from './department-scope.js';

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
