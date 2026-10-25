import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyDepartmentScope } from '../../common/utils/department-scope.js';
import { Application } from '../applications/entities/application.entity.js';
import { Job, JobStatus } from '../jobs/entities/job.entity.js';

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

@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // FR-DASH, Kickoff 14
  async summary(user: ScopeUser): Promise<DashboardSummaryView> {
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
