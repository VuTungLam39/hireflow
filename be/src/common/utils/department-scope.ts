import { ForbiddenException } from '@nestjs/common';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Role } from '../enums/role.enum.js';
import type { AuthUser } from '../interfaces/jwt-payload.interface.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId' | 'organizationId'> & { id?: string };

export type DataScope = 'all' | 'department' | 'assigned' | 'none';

// BR-TEN-01
export function orgIdOf(user: Pick<AuthUser, 'organizationId'>): string {
  if (!user.organizationId) throw new ForbiddenException('No organization');
  return user.organizationId;
}

// BR-ACC-07, BR-INT-02
export function dataScope(role: Role): DataScope {
  switch (role) {
    case Role.Admin:
    case Role.Hr:
      return 'all';
    case Role.HiringManager:
      return 'department';
    case Role.Interviewer:
      return 'assigned';
    // BR-TEN-04
    case Role.PlatformAdmin:
      return 'none';
    default: {
      const unhandled: never = role;
      throw new Error(`Role has no data scope: ${String(unhandled)}`);
    }
  }
}

// MVP 3.1 · BR-JOB-12: HM thấy tin của phòng mình và tin được gán phụ trách (luôn trong công ty mình)
export function inManagerScope(
  user: ScopeUser,
  job: { departmentId: string; hiringManagerId?: string | null },
): boolean {
  return (
    (!!user.departmentId && job.departmentId === user.departmentId) ||
    (!!user.id && job.hiringManagerId === user.id)
  );
}

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

// Backend Architecture 10.4, BR-ACC-07, BR-INT-02, BR-TEN-02
export function applyDepartmentScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  orgColumn: string,
  departmentColumn: string,
  assigned?: AssignedScope,
): SelectQueryBuilder<T> {
  const scope = dataScope(user.role);
  qb.andWhere(`${orgColumn} = :scopeOrgId`, { scopeOrgId: orgIdOf(user) });
  if (scope === 'all') return qb;
  if (scope === 'assigned') return applyInterviewerScope(qb, user, assigned);
  // BR-JOB-12: departmentColumn luôn là cột phòng ban của tin; cột HM phụ trách nằm cạnh nó
  const managerColumn = departmentColumn.replace(/departmentId$/, 'hiringManagerId');
  if (managerColumn === departmentColumn) {
    throw new Error(`departmentColumn must be <job alias>.departmentId, got ${departmentColumn}`);
  }
  const parts: string[] = [];
  if (user.departmentId) parts.push(`${departmentColumn} = :scopeDepartmentId`);
  if (user.id) parts.push(`${managerColumn} = :scopeManagerId`);
  if (!parts.length) return qb.andWhere('1 = 0');
  return qb.andWhere(`(${parts.join(' OR ')})`, {
    scopeDepartmentId: user.departmentId,
    scopeManagerId: user.id,
  });
}

// BR-CAND-03, BR-INT-02, BR-TEN-02
export function applyCandidateScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  user: ScopeUser,
  orgColumn: string,
  candidateIdColumn: string,
  assigned?: AssignedScope,
): SelectQueryBuilder<T> {
  const scope = dataScope(user.role);
  qb.andWhere(`${orgColumn} = :scopeOrgId`, { scopeOrgId: orgIdOf(user) });
  if (scope === 'all') return qb;
  if (scope === 'assigned') return applyInterviewerScope(qb, user, assigned);
  // BR-JOB-12
  const parts: string[] = [];
  if (user.departmentId) parts.push(`"scope_job"."department_id" = :scopeDepartmentId`);
  if (user.id) parts.push(`"scope_job"."hiring_manager_id" = :scopeManagerId`);
  if (!parts.length) return qb.andWhere('1 = 0');
  return qb.andWhere(
    `EXISTS (SELECT 1 FROM "applications" "scope_app" INNER JOIN "jobs" "scope_job" ON "scope_job"."id" = "scope_app"."job_id" WHERE "scope_app"."candidate_id" = ${candidateIdColumn} AND "scope_app"."deleted_at" IS NULL AND "scope_job"."deleted_at" IS NULL AND (${parts.join(' OR ')}))`,
    { scopeDepartmentId: user.departmentId, scopeManagerId: user.id },
  );
}
