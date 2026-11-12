import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import type { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import {
  applyDepartmentScope,
  applyInterviewerScope,
} from '../../common/utils/department-scope.js';
import { normalizeKeywords } from '../../common/utils/text.js';
import { CvPipelineService } from '../ai/pipeline/cv-pipeline.service.js';
import { RequirementsSuggester } from '../ai/requirements-suggester.service.js';
import { Application } from '../applications/entities/application.entity.js';
import { DepartmentsService } from '../departments/departments.service.js';
import { MatchingService } from '../matching/matching.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { QueryJobDto } from './dto/query-job.dto.js';
import { SaveRequirementsDto } from './dto/save-requirements.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { JobRequirement } from './entities/job-requirement.entity.js';
import {
  EmploymentType,
  Job,
  JobLevel,
  JobStatus,
  SalaryVisibility,
  WorkMode,
} from './entities/job.entity.js';
import { notExpiredSql, vnToday } from '../../common/utils/vn-date.js';
import { PrerenderHookService } from './prerender-hook.service.js';
import { Role } from '../../common/enums/role.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { QueryPublicJobsDto } from './dto/query-public-jobs.dto.js';

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
  deadline: string | null;
  createdAt: Date;
}

export interface JobDetailsView {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryVisibility: SalaryVisibility;
  level: JobLevel | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  headcount: number;
  deadline: string | null;
  benefits: string;
}

export interface JobView extends JobSummaryView, JobDetailsView {
  jdText: string;
  jdVersion: number;
  requirements: RequirementView[];
  updatedAt: Date;
}

// BR-JOB-08: ứng viên chỉ thấy số khi RANGE
export type PublicSalary =
  { mode: 'RANGE'; min: number | null; max: number | null } | { mode: 'NEGOTIABLE' } | null;

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

export interface PublicJobSummaryView {
  id: string;
  title: string;
  location: string;
  department: { name: string };
  publishedAt: Date;
  salary: PublicSalary;
  level: JobLevel | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  headcount: number;
  deadline: string | null;
}

export interface PublicJobView extends PublicJobSummaryView {
  /** BR-JOB-10: quá hạn nộp thì vẫn xem được tin nhưng không nhận hồ sơ */
  expired: boolean;
  benefits: string;
  jdText: string;
  requirements: { label: string; type: JobRequirement['type'] }[];
}

const EMPTY_PIPELINE: JobPipeline = { new: 0, inProgress: 0, hired: 0, closed: 0 };

// BR-JOB-08
export function publicSalary(
  job: Pick<Job, 'salaryVisibility' | 'salaryMin' | 'salaryMax'>,
): PublicSalary {
  if (job.salaryVisibility === SalaryVisibility.Hidden) return null;
  if (job.salaryVisibility === SalaryVisibility.Range && (job.salaryMin || job.salaryMax)) {
    return { mode: 'RANGE', min: job.salaryMin, max: job.salaryMax };
  }
  return { mode: 'NEGOTIABLE' };
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobsRepository: Repository<Job>,
    @InjectRepository(JobRequirement)
    private readonly requirementsRepository: Repository<JobRequirement>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly departmentsService: DepartmentsService,
    private readonly suggester: RequirementsSuggester,
    private readonly pipeline: CvPipelineService,
    private readonly prerender: PrerenderHookService,
    private readonly matching: MatchingService,
    private readonly events: AppEvents,
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
      .offset(query.skip)
      .limit(query.limit);

    applyDepartmentScope(qb, user, 'job.departmentId', { jobIdColumn: '"job"."id"' });
    if (query.status) qb.andWhere('job.status = :status', { status: query.status });
    if (query.departmentId) {
      qb.andWhere('job.departmentId = :departmentId', { departmentId: query.departmentId });
    }
    if (query.search) qb.andWhere('job.title ILIKE :search', { search: `%${query.search}%` });

    const [jobs, total] = await qb.getManyAndCount();
    const pipelines = await this.pipelines(
      jobs.map((j) => j.id),
      user,
    );
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
      this.pipelines([job.id], user),
    ]);
    return {
      ...this.toSummary(job, pipelines.get(job.id)),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryVisibility: job.salaryVisibility,
      level: job.level,
      employmentType: job.employmentType,
      workMode: job.workMode,
      headcount: job.headcount,
      benefits: job.benefits,
      jdText: job.jdText,
      jdVersion: job.jdVersion,
      requirements,
      updatedAt: job.updatedAt,
    };
  }

  // BR-JOB-08, BR-JOB-10
  private assertDetails(dto: UpdateJobDto, current?: Job) {
    const errors: { field: string; messages: string[] }[] = [];
    const min = dto.salaryMin !== undefined ? dto.salaryMin : (current?.salaryMin ?? null);
    const max = dto.salaryMax !== undefined ? dto.salaryMax : (current?.salaryMax ?? null);
    if (min !== null && max !== null && min > max) {
      errors.push({ field: 'salaryMax', messages: ['Lương đến phải lớn hơn hoặc bằng lương từ'] });
    }
    if (dto.deadline && dto.deadline !== current?.deadline && dto.deadline < vnToday()) {
      errors.push({ field: 'deadline', messages: ['Hạn nộp không được ở quá khứ'] });
    }
    if (errors.length) {
      throw new BusinessException(
        ErrorCode.ValidationFailed,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        errors,
      );
    }
  }

  // BR-JOB-01
  async create(dto: CreateJobDto, user: ScopeUser): Promise<JobView> {
    this.assertDetails(dto);
    await this.assertDepartment(dto.departmentId);
    const saved = await this.jobsRepository.save(
      this.jobsRepository.create({ ...dto, status: JobStatus.Draft, createdBy: user.id }),
    );
    this.events.emit('job.changed', { jobId: saved.id });
    return this.findOne(saved.id, user);
  }

  // F4: bản nháp mới giữ JD, trường cấu trúc và tiêu chí phiên bản mới nhất (thành phiên bản 1);
  // không copy hồ sơ, bỏ hạn nộp; không chạy match-job hay prerender vì tin còn DRAFT
  async clone(id: string, user: ScopeUser): Promise<JobView> {
    const src = await this.getOrFail(id);
    await this.assertDepartment(src.departmentId);
    const suffix = ' (bản sao)';
    const newId = await this.dataSource.transaction(async (manager) => {
      const job = await manager.save(
        manager.create(Job, {
          title: src.title.slice(0, 200 - suffix.length) + suffix,
          departmentId: src.departmentId,
          location: src.location,
          jdText: src.jdText,
          salaryMin: src.salaryMin,
          salaryMax: src.salaryMax,
          salaryVisibility: src.salaryVisibility,
          level: src.level,
          employmentType: src.employmentType,
          workMode: src.workMode,
          headcount: src.headcount,
          benefits: src.benefits,
          deadline: null,
          status: JobStatus.Draft,
          jdVersion: 1,
          createdBy: user.id,
        }),
      );
      const requirements = await manager.find(JobRequirement, {
        where: { jobId: id, jdVersion: src.jdVersion },
        order: { position: 'ASC' },
      });
      if (requirements.length) {
        await manager.insert(
          JobRequirement,
          requirements.map((r) => ({
            jobId: job.id,
            jdVersion: 1,
            position: r.position,
            label: r.label,
            type: r.type,
            weight: r.weight,
            minYears: r.minYears,
            keywords: r.keywords,
          })),
        );
      }
      return job.id;
    });
    this.events.emit('job.changed', { jobId: newId });
    return this.findOne(newId, user);
  }

  // BR-JOB-04
  async update(id: string, dto: UpdateJobDto, user: ScopeUser): Promise<JobView> {
    const job = await this.getOrFail(id);
    this.assertEditable(job);
    this.assertDetails(dto, job);
    if (dto.departmentId) await this.assertDepartment(dto.departmentId);
    await this.jobsRepository.update(id, dto);
    if (job.status === JobStatus.Open) this.prerender.schedule('job.updated');
    this.events.emit('job.changed', { jobId: id });
    return this.findOne(id, user);
  }

  // Kickoff 8.2
  async suggestRequirements(id: string) {
    const job = await this.getOrFail(id);
    return this.suggester.suggest(job.title, job.jdText);
  }

  // BR-JOB-05, BR-JOB-06, BR-AI-05
  async saveRequirements(
    id: string,
    dto: SaveRequirementsDto,
    requestId?: string,
  ): Promise<{ jdVersion: number }> {
    const result = await this.dataSource.transaction(async (manager) => {
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
      return { jdVersion, isOpen: job.status === JobStatus.Open };
    });
    // Kickoff 12: job.requirements.updated
    await this.pipeline.enqueueJobRescore(id, result.jdVersion, requestId);
    if (result.isOpen) {
      this.prerender.schedule('job.requirements.updated');
      await this.matching.enqueue(id, result.jdVersion, requestId);
    }
    return { jdVersion: result.jdVersion };
  }

  // BR-JOB-02
  async publish(id: string, user: ScopeUser, requestId?: string): Promise<JobView> {
    const jdVersion = await this.dataSource.transaction(async (manager) => {
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
      // BR-JOB-10: không đăng tin đã quá hạn nộp (sẽ không ai thấy trên trang công khai)
      if (job.deadline && job.deadline < vnToday()) {
        throw new BusinessException(
          ErrorCode.JobNotPublishable,
          'The application deadline has already passed',
          HttpStatus.CONFLICT,
          [{ field: 'deadline', messages: ['Hạn nộp đã qua. Đổi hạn nộp trước khi đăng tin'] }],
        );
      }
      await manager.update(Job, id, { status: JobStatus.Open, publishedAt: new Date() });
      return job.jdVersion;
    });
    this.prerender.schedule('job.published');
    this.events.emit('job.changed', { jobId: id });
    // Kickoff 12: job.published
    await this.matching.enqueue(id, jdVersion, requestId);
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
    this.prerender.schedule('job.closed');
    this.events.emit('job.changed', { jobId: id });
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
    this.events.emit('job.changed', { jobId: id });
  }

  // US-05
  async ranking(id: string, user: ScopeUser): Promise<RankingView> {
    // BR-INT-02
    if (user.role === Role.Interviewer) throw new NotFoundException('Job not found');
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

  // US-03, BR-JOB-07
  async findPublic(query: QueryPublicJobsDto): Promise<PaginatedResult<PublicJobSummaryView>> {
    const qb = this.publicQuery()
      .orderBy('job.publishedAt', 'DESC')
      .addOrderBy('job.id', 'DESC')
      .offset(query.skip)
      .limit(query.limit);
    this.applyPublicSearch(qb, query.search);
    qb.andWhere(notExpiredSql('job'));
    if (query.departmentId) {
      qb.andWhere('job.departmentId = :departmentId', { departmentId: query.departmentId });
    }
    if (query.level) qb.andWhere('job.level = :level', { level: query.level });
    if (query.employmentType) {
      qb.andWhere('job.employmentType = :employmentType', {
        employmentType: query.employmentType,
      });
    }
    if (query.workMode) qb.andWhere('job.workMode = :workMode', { workMode: query.workMode });
    const [jobs, total] = await qb.getManyAndCount();
    return new PaginatedResult(
      jobs.map((j) => this.toPublicSummary(j)),
      total,
      query.page,
      query.limit,
    );
  }

  // US-03
  async publicDepartments(search?: string): Promise<{ id: string; name: string; count: number }[]> {
    const qb = this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.department', 'department')
      .select('department.id', 'id')
      .addSelect('department.name', 'name')
      .addSelect('COUNT(*)::int', 'count')
      .where('job.status = :open', { open: JobStatus.Open })
      .andWhere(notExpiredSql('job'))
      .groupBy('department.id')
      .addGroupBy('department.name')
      .orderBy('count', 'DESC')
      .addOrderBy('department.name', 'ASC');
    this.applyPublicSearch(qb, search);
    return qb.getRawMany<{ id: string; name: string; count: number }>();
  }

  private applyPublicSearch(qb: SelectQueryBuilder<Job>, search?: string) {
    if (!search) return;
    qb.andWhere(`f_unaccent(lower(job.title)) LIKE '%' || f_unaccent(lower(:search)) || '%'`, {
      search: escapeLike(search),
    });
  }

  // BR-APP-02, BR-JOB-07
  async findPublicOne(id: string): Promise<PublicJobView> {
    const job = await this.publicQuery()
      .addSelect(['job.jdText', 'job.benefits'])
      .addSelect(`NOT ${notExpiredSql('job')}`, 'expired')
      .andWhere('job.id = :id', { id })
      .getRawAndEntities()
      .then(({ entities, raw }) =>
        entities[0] ? Object.assign(entities[0], { expired: !!raw[0]?.expired }) : null,
      );
    if (!job) throw new NotFoundException('Job not found');
    const requirements = await this.requirementsRepository.find({
      select: ['label', 'type'],
      where: { jobId: job.id, jdVersion: job.jdVersion },
      order: { position: 'ASC' },
    });
    return {
      ...this.toPublicSummary(job),
      expired: job.expired,
      benefits: job.benefits,
      jdText: job.jdText,
      requirements: requirements.map((r) => ({ label: r.label, type: r.type })),
    };
  }

  private publicQuery() {
    return this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.department', 'department')
      .select([
        'job.id',
        'job.title',
        'job.location',
        'job.publishedAt',
        'job.jdVersion',
        'job.salaryMin',
        'job.salaryMax',
        'job.salaryVisibility',
        'job.level',
        'job.employmentType',
        'job.workMode',
        'job.headcount',
        'job.deadline',
        'department.id',
        'department.name',
      ])
      .where('job.status = :open', { open: JobStatus.Open });
  }

  private toPublicSummary(job: Job): PublicJobSummaryView {
    return {
      id: job.id,
      title: job.title,
      location: job.location,
      department: { name: job.department!.name },
      publishedAt: job.publishedAt!,
      salary: publicSalary(job),
      level: job.level,
      employmentType: job.employmentType,
      workMode: job.workMode,
      headcount: job.headcount,
      deadline: job.deadline,
    };
  }

  // Kickoff 14, Database Design Q6
  private async pipelines(jobIds: string[], user: ScopeUser): Promise<Map<string, JobPipeline>> {
    if (!jobIds.length) return new Map();
    const S = ApplicationStatus;
    const qb = this.dataSource
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
      .groupBy('app.jobId');
    // BR-INT-02
    if (user.role === Role.Interviewer) {
      applyInterviewerScope(qb, user, { applicationIdColumn: '"app"."id"' });
    }
    const rows = await qb.getRawMany<JobPipeline & { jobId: string }>();
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
      deadline: job.deadline,
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
    const job = await applyDepartmentScope(qb, user, 'job.departmentId', {
      jobIdColumn: '"job"."id"',
    }).getOne();
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
