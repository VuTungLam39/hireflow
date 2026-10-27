import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId'> & { id?: string };

// BR-INT-02: cột để lọc "được giao" cho Interviewer; không truyền thì Interviewer không thấy gì
export interface AssignedScope {
  applicationIdColumn?: string;
  jobIdColumn?: string;
  cvFileIdColumn?: string;
}

const ASSIGNED_INTERVIEW = `SELECT 1 FROM "interviews" "scope_iv" INNER JOIN "interview_assignees" "scope_ia" ON "scope_ia"."interview_id" = "scope_iv"."id" WHERE "scope_ia"."user_id" = :scopeUserId AND "scope_iv"."status" <> 'CANCELLED'`;

// BR-INT-02
export function applyInterviewerScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  assigned: AssignedScope = {},
): SelectQueryBuilder<T> {
  if (!user.id) return qb.andWhere('1 = 0');
  const params = { scopeUserId: user.id };
  if (assigned.applicationIdColumn) {
    return qb.andWhere(
      `EXISTS (${ASSIGNED_INTERVIEW} AND "scope_iv"."application_id" = ${assigned.applicationIdColumn})`,
      params,
    );
  }
  if (assigned.jobIdColumn) {
    return qb.andWhere(
      `EXISTS (${ASSIGNED_INTERVIEW} AND EXISTS (SELECT 1 FROM "applications" "scope_ja" WHERE "scope_ja"."id" = "scope_iv"."application_id" AND "scope_ja"."job_id" = ${assigned.jobIdColumn}))`,
      params,
    );
  }
  if (assigned.cvFileIdColumn) {
    return qb.andWhere(
      `EXISTS (${ASSIGNED_INTERVIEW} AND EXISTS (SELECT 1 FROM "applications" "scope_fa" WHERE "scope_fa"."id" = "scope_iv"."application_id" AND "scope_fa"."cv_file_id" = ${assigned.cvFileIdColumn}))`,
      params,
    );
  }
  return qb.andWhere('1 = 0');
}

// Backend Architecture 10.4, BR-ACC-07, BR-INT-02
export function applyDepartmentScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  departmentColumn: string,
  assigned?: AssignedScope,
): SelectQueryBuilder<T> {
  if (user.role === Role.Interviewer) return applyInterviewerScope(qb, user, assigned);
  if (user.role !== Role.HiringManager) return qb;
  if (!user.departmentId) return qb.andWhere('1 = 0');
  return qb.andWhere(`${departmentColumn} = :scopeDepartmentId`, {
    scopeDepartmentId: user.departmentId,
  });
}

// BR-CAND-03, BR-INT-02
export function applyCandidateScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  candidateIdColumn: string,
  assigned?: AssignedScope,
): SelectQueryBuilder<T> {
  if (user.role === Role.Interviewer) return applyInterviewerScope(qb, user, assigned);
  if (user.role !== Role.HiringManager) return qb;
  if (!user.departmentId) return qb.andWhere('1 = 0');
  return qb.andWhere(
    `EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = ${candidateIdColumn} AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND "scope_job"."department_id" = :scopeDepartmentId)`,
    { scopeDepartmentId: user.departmentId },
  );
}
