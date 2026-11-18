import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { escapeLike } from '../../common/utils/text.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { EmailService } from '../email/email.service.js';
import { EmailTemplate } from '../email/email.types.js';
import { PrerenderHookService } from '../jobs/prerender-hook.service.js';
import { User } from '../users/entities/user.entity.js';
import { AiQuotaService, type AiUsageDay } from '../ai/ai-quota.service.js';
import { AiLimitsDto, QueryOrganizationsDto } from './dto/platform.dto.js';
import { Organization, OrganizationStatus } from './entities/organization.entity.js';

export interface PlatformOrganizationView {
  id: string;
  name: string;
  slug: string;
  taxCode: string | null;
  website: string | null;
  status: OrganizationStatus;
  statusReason: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  aiDailyScoreLimit: number;
  aiDailyChatLimit: number;
  adminEmail: string | null;
  userCount: number;
  openJobs: number;
  applications30d: number;
}

export type OrgTransition = 'approve' | 'reject' | 'suspend' | 'reactivate';

const S = OrganizationStatus;

// BR-ORG-04
const TRANSITIONS: Record<
  OrgTransition,
  {
    from: OrganizationStatus;
    to: OrganizationStatus;
    action: AuditAction;
    template:
      | EmailTemplate.OrgApproved
      | EmailTemplate.OrgRejected
      | EmailTemplate.OrgSuspended
      | EmailTemplate.OrgReactivated;
  }
> = {
  approve: {
    from: S.Pending,
    to: S.Active,
    action: AuditAction.OrgApproved,
    template: EmailTemplate.OrgApproved,
  },
  reject: {
    from: S.Pending,
    to: S.Rejected,
    action: AuditAction.OrgRejected,
    template: EmailTemplate.OrgRejected,
  },
  suspend: {
    from: S.Active,
    to: S.Suspended,
    action: AuditAction.OrgSuspended,
    template: EmailTemplate.OrgSuspended,
  },
  reactivate: {
    from: S.Suspended,
    to: S.Active,
    action: AuditAction.OrgReactivated,
    template: EmailTemplate.OrgReactivated,
  },
};

// BR-TEN-04: chỉ thông tin công ty và số đếm, không đọc dữ liệu tuyển dụng
const SELECT_VIEW = `
  SELECT o.id, o.name, o.slug, o.tax_code AS "taxCode", o.website, o.status,
    o.status_reason AS "statusReason", o.approved_at AS "approvedAt", o.created_at AS "createdAt",
    o.ai_daily_score_limit AS "aiDailyScoreLimit", o.ai_daily_chat_limit AS "aiDailyChatLimit",
    (SELECT u.email FROM users u WHERE u.organization_id = o.id AND u.role = 'admin'
      AND u.deleted_at IS NULL ORDER BY u.created_at LIMIT 1) AS "adminEmail",
    (SELECT count(*)::int FROM users u WHERE u.organization_id = o.id AND u.deleted_at IS NULL) AS "userCount",
    (SELECT count(*)::int FROM jobs j WHERE j.organization_id = o.id AND j.status = 'OPEN'
      AND j.deleted_at IS NULL) AS "openJobs",
    (SELECT count(*)::int FROM applications a WHERE a.organization_id = o.id AND a.deleted_at IS NULL
      AND a.created_at > now() - interval '30 days') AS "applications30d"
  FROM organizations o`;

// MVP 3 · US-20, F-PLAT-01, F-PLAT-03
@Injectable()
export class PlatformOrganizationsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly prerender: PrerenderHookService,
    private readonly quota: AiQuotaService,
  ) {}

  async findAll(query: QueryOrganizationsDto): Promise<PaginatedResult<PlatformOrganizationView>> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.status) {
      params.push(query.status);
      where.push(`o.status = $${params.length}`);
    }
    if (query.search?.trim()) {
      params.push(`%${escapeLike(query.search.trim())}%`);
      where.push(
        `(o.name ILIKE $${params.length} OR o.slug ILIKE $${params.length} OR o.tax_code LIKE $${params.length})`,
      );
    }
    const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows, [{ total }]] = await Promise.all([
      this.dataSource.query<PlatformOrganizationView[]>(
        `${SELECT_VIEW} ${filter} ORDER BY o.created_at ${query.order}, o.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.limit, query.skip],
      ),
      this.dataSource.query<{ total: number }[]>(
        `SELECT count(*)::int AS total FROM organizations o ${filter}`,
        params,
      ),
    ]);
    return new PaginatedResult(rows, total, query.page, query.limit);
  }

  // US-25: kèm mức dùng hôm nay và 6 ngày trước (giờ VN)
  async findOne(id: string): Promise<PlatformOrganizationView & { aiUsage: AiUsageDay[] }> {
    const [row] = await this.dataSource.query<PlatformOrganizationView[]>(
      `${SELECT_VIEW} WHERE o.id = $1`,
      [id],
    );
    if (!row) throw new NotFoundException('Organization not found');
    return { ...row, aiUsage: await this.quota.usage(id) };
  }

  // BR-AI-11, F-PLAT-02
  async updateAiLimits(id: string, dto: AiLimitsDto, actor: Pick<AuthUser, 'id'>) {
    await this.dataSource.transaction(async (m) => {
      const before = await m.findOne(Organization, {
        select: { id: true, aiDailyScoreLimit: true, aiDailyChatLimit: true },
        where: { id },
      });
      if (!before) throw new NotFoundException('Organization not found');
      await m.update(Organization, id, dto);
      await this.audit.record(
        {
          organizationId: id,
          actorId: actor.id,
          action: AuditAction.OrgAiLimitsUpdated,
          entity: AuditEntity.Organization,
          entityId: id,
          metadata: {
            scoreFrom: before.aiDailyScoreLimit,
            scoreTo: dto.aiDailyScoreLimit,
            chatFrom: before.aiDailyChatLimit,
            chatTo: dto.aiDailyChatLimit,
          },
        },
        m,
      );
    });
    this.quota.invalidate(id);
    return this.findOne(id);
  }

  async transition(
    id: string,
    kind: OrgTransition,
    actor: Pick<AuthUser, 'id'>,
    reason?: string,
  ): Promise<PlatformOrganizationView> {
    const t = TRANSITIONS[kind];
    const outboxIds = await this.dataSource.transaction(async (m) => {
      const res = await m
        .createQueryBuilder()
        .update(Organization)
        .set({
          status: t.to,
          statusReason: reason ?? null,
          ...(kind === 'approve' ? { approvedBy: actor.id, approvedAt: () => 'now()' } : {}),
        })
        .where('id = :id AND status = :from', { id, from: t.from })
        .returning(['name'])
        .execute();
      const name = (res.raw as { name: string }[])[0]?.name;
      if (!name) {
        if (!(await m.existsBy(Organization, { id }))) {
          throw new NotFoundException('Organization not found');
        }
        throw new BusinessException(
          ErrorCode.InvalidOrgTransition,
          `Cannot ${kind} an organization that is not ${t.from}`,
          HttpStatus.CONFLICT,
        );
      }
      await this.audit.record(
        {
          organizationId: id,
          actorId: actor.id,
          action: t.action,
          entity: AuditEntity.Organization,
          entityId: id,
          metadata: { from: t.from, to: t.to, ...(reason ? { reason } : {}) },
        },
        m,
      );
      const admins = await m.find(User, {
        select: { email: true },
        where: { organizationId: id, role: Role.Admin, isActive: true },
      });
      const ids: string[] = [];
      for (const admin of admins) {
        ids.push(
          await this.email.enqueue(
            {
              organizationId: id,
              to: admin.email,
              template: t.template,
              payload: { companyName: name, reason: reason ?? '' },
            },
            m,
          ),
        );
      }
      return ids;
    });
    await this.email.dispatch(outboxIds);
    // US-20: tin của công ty hiện hoặc ẩn ở lần build trang công khai kế tiếp
    this.prerender.schedule(`organization ${kind}`);
    return this.findOne(id);
  }
}
