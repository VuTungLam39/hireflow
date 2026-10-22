import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import type { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyDepartmentScope } from '../../common/utils/department-scope.js';
import { normalizeKeywords } from '../../common/utils/text.js';
import { Application } from '../applications/entities/application.entity.js';
import { DepartmentsService } from '../departments/departments.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { QueryJobDto } from './dto/query-job.dto.js';
import { SaveRequirementsDto } from './dto/save-requirements.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { JobRequirement } from './entities/job-requirement.entity.js';
import { Job, JobStatus } from './entities/job.entity.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

export interface JobPipeline {
  new: number;
  inProgress: number;
  hired: number;
  closed: number;
}

export interface RequirementView {
  id: string;
  label: string;
  type: JobRequirement['type'];
  weight: number;
  minYears: number | null;
  keywords: string[];
}

export interface JobSummaryView {
  id: string;
  title: string;
  status: JobStatus;
  location: string;
  department: { id: string; name: string };
  applicationCount: number;
  pipeline: JobPipeline;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface JobView extends JobSummaryView {
  jdText: string;
  jdVersion: number;
  requirements: RequirementView[];
  updatedAt: Date;
}

export interface RankingView {
  job: { id: string; title: string; status: JobStatus; jdVersion: number };
  requirements: RequirementView[];
  items: {
    applicationId: string;
    candidateName: string;
    status: ApplicationStatus;
    aiStatus: AiStatus;
    flags: ScoreFlag[];
    matches: { requirementId: string; match: 0 | 0.5 | 1 }[];
  }[];
}

const EMPTY_PIPELINE: JobPipeline = { new: 0, inProgress: 0, hired: 0, closed: 0 };

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobsRepository: Repository<Job>,
    @InjectRepository(JobRequirement)
    private readonly requirementsRepository: Repository<JobRequirement>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async findAll(query: QueryJobDto, user: ScopeUser): Promise<PaginatedResult<JobSummaryView>> {
    const qb = this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.department', 'department')
      .addSelect(['department.id', 'department.name'])
      .orderBy(
        `job.${query.sortBy}`,
        query.order,
        query.order === 'DESC' ? 'NULLS LAST' : 'NULLS FIRST',
      )
      .addOrderBy('job.id', query.order)
      .skip(query.skip)
      .take(query.limit);

    applyDepartmentScope(qb, user, 'job.departmentId');
    if (query.status) qb.andWhere('job.status = :status', { status: query.status });
    if (query.departmentId) {
      qb.andWhere('job.departmentId = :departmentId', { departmentId: query.departmentId });
    }
    if (query.search) qb.andWhere('job.title ILIKE :search', { search: `%${query.search}%` });

    const [jobs, total] = await qb.getManyAndCount();
    const pipelines = await this.pipelines(jobs.map((j) => j.id));
    return new PaginatedResult(
      jobs.map((j) => this.toSummary(j, pipelines.get(j.id))),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string, user: ScopeUser): Promise<JobView> {
    const job = await this.findScoped(id, user);
    const [requirements, pipelines] = await Promise.all([
      this.currentRequirements(job),
      this.pipelines([job.id]),
    ]);
    return {
      ...this.toSummary(job, pipelines.get(job.id)),
      jdText: job.jdText,
      jdVersion: job.jdVersion,
      requirements,
      updatedAt: job.updatedAt,
    };
  }

  // BR-JOB-01
  async create(dto: CreateJobDto, user: ScopeUser): Promise<JobView> {
    await this.assertDepartment(dto.departmentId);
    const saved = await this.jobsRepository.save(
      this.jobsRepository.create({ ...dto, status: JobStatus.Draft, createdBy: user.id }),
    );
    return this.findOne(saved.id, user);
  }

  // BR-JOB-04
  async update(id: string, dto: UpdateJobDto, user: ScopeUser): Promise<JobView> {
    const job = await this.getOrFail(id);
    this.assertEditable(job);
    if (dto.departmentId) await this.assertDepartment(dto.departmentId);
    await this.jobsRepository.update(id, dto);
    return this.findOne(id, user);
  }

  // TODO tuần 3: LlmProvider
  async suggestRequirements(id: string): Promise<never> {
    await this.getOrFail(id);
    throw new BusinessException(
      ErrorCode.AiUnavailable,
      'LLM provider is not configured',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  // BR-JOB-05, BR-JOB-06, BR-AI-05
  async saveRequirements(id: string, dto: SaveRequirementsDto): Promise<{ jdVersion: number }> {
    return this.dataSource.transaction(async (manager) => {
      const job = await this.lockJob(manager, id);
      this.assertEditable(job);
      const jdVersion = job.jdVersion + 1;
      await manager.update(Job, id, { jdVersion });
      await manager.insert(
        JobRequirement,
        dto.requirements.map((r, index) => ({
          jobId: id,
          jdVersion,
          position: index + 1,
          label: r.label,
          type: r.type,
          weight: r.weight,
          minYears: r.minYears ?? null,
          keywords: normalizeKeywords(r.keywords),
        })),
      );
      // TODO tuần 3: queue score (job.requirements.updated)
      return { jdVersion };
    });
  }

  // BR-JOB-02
  async publish(id: string, user: ScopeUser): Promise<JobView> {
    await this.dataSource.transaction(async (manager) => {
      const job = await this.lockJob(manager, id);
      const hasRequirements = await manager.existsBy(JobRequirement, {
        jobId: id,
        jdVersion: job.jdVersion,
      });
      if (job.status !== JobStatus.Draft || !hasRequirements) {
        throw new BusinessException(
          ErrorCode.JobNotPublishable,
          'Job must be DRAFT with at least one requirement',
          HttpStatus.CONFLICT,
        );
      }
      await manager.update(Job, id, { status: JobStatus.Open, publishedAt: new Date() });
    });
    return this.findOne(id, user);
  }

  // BR-JOB-03
  async close(id: string, user: ScopeUser): Promise<JobView> {
    await this.dataSource.transaction(async (manager) => {
      const job = await this.lockJob(manager, id);
      if (job.status !== JobStatus.Open) {
        throw new BusinessException(
          ErrorCode.JobNotClosable,
          'Only OPEN jobs can be closed',
          HttpStatus.CONFLICT,
        );
      }
      await manager.update(Job, id, { status: JobStatus.Closed, closedAt: new Date() });
    });
    return this.findOne(id, user);
  }

  // BR-JOB-04
  async remove(id: string): Promise<void> {
    const job = await this.getOrFail(id);
    const hasApplications = await this.dataSource
      .getRepository(Application)
      .existsBy({ jobId: id });
    if (job.status !== JobStatus.Draft || hasApplications) {
      throw new BusinessException(
        ErrorCode.JobNotDeletable,
        'Only DRAFT jobs without applications can be deleted',
        HttpStatus.CONFLICT,
      );
    }
    await this.jobsRepository.softDelete(id);
  }

  // US-05
  async ranking(id: string, user: ScopeUser): Promise<RankingView> {
    const job = await this.findScoped(id, user);
    const [requirements, applications] = await Promise.all([
      this.currentRequirements(job),
      this.dataSource
        .getRepository(Application)
        .createQueryBuilder('app')
        .innerJoin('app.candidate', 'candidate')
        .select([
          'app.id',
          'app.status',
          'app.aiStatus',
          'app.flags',
          'app.scoreBreakdown',
          'app.score',
          'candidate.id',
          'candidate.fullName',
        ])
        .where('app.jobId = :id', { id })
        .orderBy('app.score', 'DESC', 'NULLS LAST')
        .addOrderBy('app.id')
        .getMany(),
    ]);

    return {
      job: { id: job.id, title: job.title, status: job.status, jdVersion: job.jdVersion },
      requirements,
      items: applications.map((a) => ({
        applicationId: a.id,
        candidateName: a.candidate!.fullName,
        status: a.status,
        aiStatus: a.aiStatus,
        flags: a.flags,
        matches:
          a.aiStatus === AiStatus.Done
            ? (a.scoreBreakdown ?? []).map(({ requirementId, match }) => ({ requirementId, match }))
            : [],
      })),
    };
  }

  // Kickoff 14, Database Design Q6
  private async pipelines(jobIds: string[]): Promise<Map<string, JobPipeline>> {
    if (!jobIds.length) return new Map();
    const S = ApplicationStatus;
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('app')
      .select('app.jobId', 'jobId')
      .addSelect(`COUNT(*) FILTER (WHERE app.status = '${S.New}')::int`, 'new')
      .addSelect(
        `COUNT(*) FILTER (WHERE app.status IN ('${S.Screening}', '${S.Interview}', '${S.Offer}'))::int`,
        'inProgress',
      )
      .addSelect(`COUNT(*) FILTER (WHERE app.status = '${S.Hired}')::int`, 'hired')
      .addSelect(
        `COUNT(*) FILTER (WHERE app.status IN ('${S.Rejected}', '${S.Withdrawn}'))::int`,
        'closed',
      )
      .where('app.jobId IN (:...jobIds)', { jobIds })
      .groupBy('app.jobId')
      .getRawMany<JobPipeline & { jobId: string }>();
    return new Map(rows.map(({ jobId, ...pipeline }) => [jobId, pipeline]));
  }

  private currentRequirements(job: Job): Promise<RequirementView[]> {
    return this.requirementsRepository.find({
      select: ['id', 'label', 'type', 'weight', 'minYears', 'keywords'],
      where: { jobId: job.id, jdVersion: job.jdVersion },
      order: { position: 'ASC' },
    });
  }

  private toSummary(job: Job, pipeline: JobPipeline = EMPTY_PIPELINE): JobSummaryView {
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      location: job.location,
      department: { id: job.department!.id, name: job.department!.name },
      applicationCount: pipeline.new + pipeline.inProgress + pipeline.hired + pipeline.closed,
      pipeline,
      publishedAt: job.publishedAt,
      createdAt: job.createdAt,
    };
  }

  // BR-ACC-07
  private async findScoped(id: string, user: ScopeUser): Promise<Job> {
    const qb = this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.department', 'department')
      .addSelect(['department.id', 'department.name'])
      .where('job.id = :id', { id });
    const job = await applyDepartmentScope(qb, user, 'job.departmentId').getOne();
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private async getOrFail(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private async lockJob(manager: EntityManager, id: string): Promise<Job> {
    const job = await manager.findOne(Job, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private assertEditable(job: Job): void {
    if (job.status !== JobStatus.Closed) return;
    throw new BusinessException(
      ErrorCode.JobNotEditable,
      'Closed jobs cannot be edited',
      HttpStatus.CONFLICT,
    );
  }

  private async assertDepartment(departmentId: string): Promise<void> {
    if (await this.departmentsService.exists(departmentId)) return;
    throw new BusinessException(
      ErrorCode.ValidationFailed,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      [{ field: 'departmentId', messages: ['Phòng ban không tồn tại'] }],
    );
  }
}
