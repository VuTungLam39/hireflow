import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyDepartmentScope } from '../../common/utils/department-scope.js';
import { vnToday } from '../../common/utils/vn-date.js';
import { ApplicationStatusHistory } from '../applications/entities/application-status-history.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Job, JobStatus } from '../jobs/entities/job.entity.js';
import { DashboardCache } from './dashboard-cache.service.js';
import type { QueryFunnelDto } from './dto/query-funnel.dto.js';
import { buildFunnel, type FunnelView, type TransitionRow } from './funnel.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId'>;

export interface DashboardSummaryView {
  totals: { applications: number; openJobs: number; processing: number; avgScore: number | null };
  byStatus: Record<ApplicationStatus, number>;
  byJob: { jobId: string; title: string; total: number; avgScore: number | null; hired: number }[];
}

interface JobRow {
  jobId: string;
  title: string;
  status: JobStatus;
  total: number;
  processing: number;
  scoreSum: number;
  scored: number;
  byStatus: Record<ApplicationStatus, number> | null;
}

const STATUSES = Object.values(ApplicationStatus);

const average = (sum: number, count: number) => (count ? Math.round(sum / count) : null);

export const FUNNEL_CACHE_TTL_SECONDS = 300;
const FUNNEL_DEFAULT_DAYS = 90;
const FUNNEL_MAX_DAYS = 366;
const DAY_MS = 86_400_000;
const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);
const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cache: DashboardCache,
  ) {}

  // FR-DASH, Kickoff 14, BR-ACC-07
  summary(user: ScopeUser): Promise<DashboardSummaryView> {
    const scope = user.role === Role.HiringManager ? `dept:${user.departmentId}` : 'all';
    return this.cache.getOrCompute(scope, () => this.compute(user));
  }

  // F1 · BR-REP-01: phễu theo cohort ngày nộp (giờ VN), cache 5 phút theo phạm vi + tham số
  async funnel(query: QueryFunnelDto, user: ScopeUser): Promise<FunnelView> {
    const to = query.to ?? vnToday();
    const from = query.from ?? dayOf(dayMs(to) - (FUNNEL_DEFAULT_DAYS - 1) * DAY_MS);
    const days = (dayMs(to) - dayMs(from)) / DAY_MS + 1;
    if (Number.isNaN(days) || days < 1 || days > FUNNEL_MAX_DAYS) {
      throw new BadRequestException(`from..to must be 1-${FUNNEL_MAX_DAYS} days`);
    }
    if (query.jobId) await this.assertJobInScope(query.jobId, user);

    const scope = user.role === Role.HiringManager ? `dept:${user.departmentId}` : 'all';
    const key = `funnel:${scope}:${from}:${to}:${query.jobId ?? 'all'}`;
    return this.cache.getOrComputeFor(key, FUNNEL_CACHE_TTL_SECONDS, async () => {
      const qb = this.dataSource
        .getRepository(ApplicationStatusHistory)
        .createQueryBuilder('h')
        .innerJoin(Application, 'app', 'app.id = h.applicationId')
        .innerJoin(Job, 'job', 'job.id = app.jobId')
        .select('app.source', 'source')
        .addSelect('h.fromStatus', 'fromStatus')
        .addSelect('h.toStatus', 'toStatus')
        .addSelect('COUNT(*)::int', 'n')
        .addSelect('percentile_disc(0.5) WITHIN GROUP (ORDER BY h.prev_stage_seconds)', 'p50')
        .where('app.createdAt >= :start AND app.createdAt < :end', {
          start: new Date(`${from}T00:00:00+07:00`),
          end: new Date(Date.parse(`${to}T00:00:00+07:00`) + DAY_MS),
        })
        .groupBy('app.source')
        .addGroupBy('h.fromStatus')
        .addGroupBy('h.toStatus');
      if (query.jobId) qb.andWhere('app.jobId = :jobId', { jobId: query.jobId });
      const rows = await applyDepartmentScope(
        qb,
        user,
        'job.departmentId',
      ).getRawMany<TransitionRow>();
      return buildFunnel(rows, { from, to });
    });
  }

  private async assertJobInScope(jobId: string, user: ScopeUser): Promise<void> {
    const qb = this.dataSource
      .getRepository(Job)
      .createQueryBuilder('job')
      .where('job.id = :jobId', { jobId });
    if (!(await applyDepartmentScope(qb, user, 'job.departmentId').getExists())) {
      throw new NotFoundException('Job not found');
    }
  }

  private async compute(user: ScopeUser): Promise<DashboardSummaryView> {
    const statusCounts = STATUSES.map(
      (s) => `'${s}', COUNT(app.id) FILTER (WHERE app.status = '${s}')`,
    ).join(', ');
    const qb = this.dataSource
      .getRepository(Job)
      .createQueryBuilder('job')
      .leftJoin(Application, 'app', 'app.jobId = job.id')
      .select('job.id', 'jobId')
      .addSelect('job.title', 'title')
      .addSelect('job.status', 'status')
      .addSelect('COUNT(app.id)::int', 'total')
      .addSelect(
        `COUNT(app.id) FILTER (WHERE app.ai_status = '${AiStatus.Processing}')::int`,
        'processing',
      )
      .addSelect('COALESCE(SUM(app.score), 0)::int', 'scoreSum')
      .addSelect('COUNT(app.score)::int', 'scored')
      .addSelect(`json_build_object(${statusCounts})`, 'byStatus')
      .groupBy('job.id');
    const rows = await applyDepartmentScope(qb, user, 'job.departmentId').getRawMany<JobRow>();

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
      ApplicationStatus,
      number
    >;
    let applications = 0;
    let processing = 0;
    let scoreSum = 0;
    let scored = 0;
    for (const row of rows) {
      applications += row.total;
      processing += row.processing;
      scoreSum += row.scoreSum;
      scored += row.scored;
      for (const s of STATUSES) byStatus[s] += row.byStatus?.[s] ?? 0;
    }

    return {
      totals: {
        applications,
        openJobs: rows.filter((r) => r.status === JobStatus.Open).length,
        processing,
        avgScore: average(scoreSum, scored),
      },
      byStatus,
      byJob: rows
        .filter((r) => r.total > 0)
        .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'vi'))
        .map((r) => ({
          jobId: r.jobId,
          title: r.title,
          total: r.total,
          avgScore: average(r.scoreSum, r.scored),
          hired: r.byStatus?.[ApplicationStatus.Hired] ?? 0,
        })),
    };
  }
}
