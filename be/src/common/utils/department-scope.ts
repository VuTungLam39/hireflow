import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId'>;

// Backend Architecture 10.4, BR-ACC-07
export function applyDepartmentScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  departmentColumn: string,
): SelectQueryBuilder<T> {
  if (user.role !== Role.HiringManager) return qb;
  if (!user.departmentId) return qb.andWhere('1 = 0');
  return qb.andWhere(`${departmentColumn} = :scopeDepartmentId`, {
    scopeDepartmentId: user.departmentId,
  });
}

// BR-CAND-03
export function applyCandidateScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  candidateIdColumn: string,
): SelectQueryBuilder<T> {
  if (user.role !== Role.HiringManager) return qb;
  if (!user.departmentId) return qb.andWhere('1 = 0');
  return qb.andWhere(
    `EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = ${candidateIdColumn} AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = :scopeDepartmentId)`,
    { scopeDepartmentId: user.departmentId },
  );
}
