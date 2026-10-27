import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result.dto.js';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyDepartmentScope } from '../../common/utils/department-scope.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { CvPipelineService } from '../ai/pipeline/cv-pipeline.service.js';
import { CandidatesService } from '../candidates/candidates.service.js';
import { Candidate } from '../candidates/entities/candidate.entity.js';
import { checkCv, type UploadedCv } from '../files/cv-file.rules.js';
import { CvFile, CvParseStatus } from '../files/entities/cv-file.entity.js';
import { FilesService } from '../files/files.service.js';
import { JobRequirement } from '../jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../jobs/entities/job.entity.js';
import { assertReopenable, assertTransition, REOPEN_TO } from './application-status.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { CvTextDto } from './dto/cv-text.dto.js';
import { HrUploadDto } from './dto/hr-upload.dto.js';
import { PublicApplyDto } from './dto/public-apply.dto.js';
import { QueryApplicationDto } from './dto/query-application.dto.js';
import { ApplicationNote } from './entities/application-note.entity.js';
import { ApplicationStatusHistory } from './entities/application-status-history.entity.js';
import { Application, type BreakdownItem } from './entities/application.entity.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

export const HR_CONSENT_VERSION = 'HR_CONFIRMED';
// BR-APP-04
export const PUBLIC_CONSENT_VERSION = 'v1';
const VN_OFFSET = '+07:00';
const DAY_MS = 86_400_000;

export interface ApplicationListItemView {
  id: string;
  status: ApplicationStatus;
  aiStatus: AiStatus;
  score: number | null;
  flags: ScoreFlag[];
  createdAt: Date;
  candidate: { id: string; fullName: string; email: string };
  job: { id: string; title: string };
}

export interface ApplicationDetailView extends Omit<ApplicationListItemView, 'candidate' | 'job'> {
  candidate: { id: string; fullName: string; email: string; phone: string | null };
  job: { id: string; title: string; jdVersion: number; departmentId: string };
  source: ApplicationSource;
  requirements: Pick<
    JobRequirement,
    'id' | 'label' | 'type' | 'weight' | 'minYears' | 'keywords'
  >[];
  breakdown: BreakdownItem[];
  scoredJdVersion: number | null;
  aiError: string | null;
  cv: {
    fileId: string;
    fileName: string;
    text: string | null;
    parseStatus: CvParseStatus;
    textEnteredAt: Date | null;
  } | null;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private readonly applicationsRepository: Repository<Application>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly candidatesService: CandidatesService,
    private readonly filesService: FilesService,
    private readonly pipeline: CvPipelineService,
    private readonly events: AppEvents,
    private readonly audit: AuditService,
  ) {}

  // US-06, BR-ACC-07
  async findAll(
    query: QueryApplicationDto,
    user: ScopeUser,
  ): Promise<PaginatedResult<ApplicationListItemView>> {
    const pageQuery = this.filteredQuery(query, user)
      .select('app.id', 'id')
      .orderBy(
        `app.${query.sortBy}`,
        query.order,
        query.sortBy === 'score' ? 'NULLS LAST' : undefined,
      )
      .addOrderBy('app.id', query.order)
      .offset(query.skip)
      .limit(query.limit);
    const countQuery = this.filteredQuery(query, user).select('COUNT(*)::int', 'total');

    // Kickoff 14: deferred join
    const [pageRows, countRow] = await Promise.all([
      pageQuery.getRawMany<{ id: string }>(),
      countQuery.getRawOne<{ total: number }>(),
    ]);
    const ids = pageRows.map((r) => r.id);
    const rows = ids.length
      ? await this.listQuery(user).andWhere('app.id IN (:...ids)', { ids }).getMany()
      : [];
    const byId = new Map(rows.map((a) => [a.id, a]));
    return new PaginatedResult(
      ids.flatMap((id) => (byId.has(id) ? [this.toListItem(byId.get(id)!)] : [])),
      countRow?.total ?? 0,
      query.page,
      query.limit,
    );
  }

  // US-06, BR-ACC-07
  private filteredQuery(query: QueryApplicationDto, user: ScopeUser) {
    const qb = this.applicationsRepository.createQueryBuilder('app');
    if (user.role === Role.HiringManager) {
      qb.innerJoin('app.job', 'job');
      applyDepartmentScope(qb, user, 'job.departmentId');
    }
    if (query.jobId) qb.andWhere('app.jobId = :jobId', { jobId: query.jobId });
    if (query.status) qb.andWhere('app.status = :status', { status: query.status });
    if (query.scoreMin !== undefined)
      qb.andWhere('app.score >= :scoreMin', { scoreMin: query.scoreMin });
    if (query.scoreMax !== undefined)
      qb.andWhere('app.score <= :scoreMax', { scoreMax: query.scoreMax });
    if (query.missingMust) {
      qb.andWhere(`app.flags @> ARRAY['${ScoreFlag.MissingMust}']::score_flag_enum[]`);
    }
    if (query.createdFrom) {
      qb.andWhere('app.createdAt >= :createdFrom', {
        createdFrom: new Date(`${query.createdFrom}T00:00:00${VN_OFFSET}`),
      });
    }
    if (query.createdTo) {
      qb.andWhere('app.createdAt < :createdBefore', {
        createdBefore: new Date(
          new Date(`${query.createdTo}T00:00:00${VN_OFFSET}`).getTime() + DAY_MS,
        ),
      });
    }
    if (query.search) {
      qb.innerJoin('app.candidate', 'candidate').andWhere(
        `(f_unaccent(lower(candidate.fullName)) LIKE '%' || f_unaccent(lower(:search)) || '%' OR candidate.email LIKE '%' || lower(:search) || '%')`,
        { search: escapeLike(query.search) },
      );
    }
    return qb;
  }

  // US-04
  async findOne(id: string, user: ScopeUser): Promise<ApplicationDetailView> {
    const app = await this.listQuery(user)
      .addSelect([
        'app.source',
        'app.aiError',
        'app.scoreBreakdown',
        'app.scoredJdVersion',
        'job.jdVersion',
        'job.departmentId',
        'candidate.phone',
        'cvFile.id',
        'cvFile.originalName',
        'cvFile.text',
        'cvFile.parseStatus',
        'cvFile.textEnteredAt',
      ])
      .leftJoin('app.cvFile', 'cvFile')
      .andWhere('app.id = :id', { id })
      .getOne();
    if (!app) throw new NotFoundException('Application not found');

    const requirements = await this.dataSource.getRepository(JobRequirement).find({
      select: ['id', 'label', 'type', 'weight', 'minYears', 'keywords'],
      where: { jobId: app.jobId, jdVersion: app.job!.jdVersion },
      order: { position: 'ASC' },
    });

    return {
      ...this.toListItem(app),
      candidate: {
        id: app.candidate!.id,
        fullName: app.candidate!.fullName,
        email: app.candidate!.email,
        phone: app.candidate!.phone,
      },
      job: {
        id: app.job!.id,
        title: app.job!.title,
        jdVersion: app.job!.jdVersion,
        departmentId: app.job!.departmentId,
      },
      source: app.source,
      requirements,
      breakdown: app.scoreBreakdown ?? [],
      scoredJdVersion: app.scoredJdVersion,
      aiError: app.aiError,
      cv: app.cvFile
        ? {
            fileId: app.cvFile.id,
            fileName: app.cvFile.originalName,
            text: app.cvFile.text,
            parseStatus: app.cvFile.parseStatus,
            textEnteredAt: app.cvFile.textEnteredAt,
          }
        : null,
    };
  }

  // US-07, BR-STS-06
  async history(id: string, user: ScopeUser) {
    await this.findReadable(id, user);
    const rows = await this.dataSource
      .getRepository(ApplicationStatusHistory)
      .createQueryBuilder('h')
      .leftJoin('h.changer', 'changer')
      .addSelect(['changer.id', 'changer.fullName'])
      .where('h.applicationId = :id', { id })
      .orderBy('h.changedAt', 'DESC')
      .addOrderBy('h.id', 'DESC')
      .getMany();
    return rows.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      changedBy: h.changer ? { id: h.changer.id, fullName: h.changer.fullName } : null,
      changedAt: h.changedAt,
    }));
  }

  // BR-APP-09
  async notes(id: string, user: ScopeUser) {
    await this.findReadable(id, user);
    const rows = await this.dataSource
      .getRepository(ApplicationNote)
      .createQueryBuilder('note')
      .innerJoin('note.author', 'author')
      .addSelect(['author.id', 'author.fullName'])
      .where('note.applicationId = :id', { id })
      .orderBy('note.createdAt', 'DESC')
      .addOrderBy('note.id', 'DESC')
      .getMany();
    return rows.map((n) => this.toNote(n));
  }

  async addNote(id: string, dto: CreateNoteDto, user: ScopeUser) {
    await this.findWritable(id, user);
    const repo = this.dataSource.getRepository(ApplicationNote);
    const saved = await repo.save(
      repo.create({ applicationId: id, authorId: user.id, content: dto.content }),
    );
    const note = await repo.findOneOrFail({ where: { id: saved.id }, relations: { author: true } });
    return this.toNote(note);
  }

  // US-07, BR-STS-01 → 03, BR-STS-07
  async changeStatus(id: string, dto: ChangeStatusDto, user: ScopeUser) {
    if (dto.status === ApplicationStatus.Hired) {
      throw new BusinessException(
        ErrorCode.InvalidStatusTransition,
        'Use PATCH /applications/:id/hire to hire',
        HttpStatus.CONFLICT,
      );
    }
    await this.findWritable(id, user);
    await this.transition(id, dto.status, dto.reason ?? null, user);
    return this.findOne(id, user);
  }

  // US-09, BR-STS-04
  async hire(id: string, user: ScopeUser) {
    await this.findWritable(id, user);
    await this.transition(id, ApplicationStatus.Hired, null, user, ApplicationStatus.Offer);
    return this.findOne(id, user);
  }

  // BR-STS-05
  async declineOffer(id: string, reason: string | undefined, user: ScopeUser) {
    await this.findWritable(id, user);
    await this.transition(
      id,
      ApplicationStatus.Rejected,
      reason ?? null,
      user,
      ApplicationStatus.Offer,
    );
    return this.findOne(id, user);
  }

  // BR-AI-08
  async rescore(id: string, user: ScopeUser, requestId?: string): Promise<null> {
    await this.findWritable(id, user);
    await this.pipeline.rescore(id, requestId);
    this.events.emit('application.changed', { applicationId: id });
    return null;
  }

  // F-APP-10, BR-APP-05, BR-STS-06
  async reopen(id: string, reason: string, user: ScopeUser): Promise<ApplicationDetailView> {
    await this.findWritable(id, user);
    await this.dataSource.transaction(async (manager) => {
      const app = await manager.findOne(Application, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!app) throw new NotFoundException('Application not found');
      assertReopenable(app.status);
      const candidate = await manager.findOneByOrFail(Candidate, { id: app.candidateId });
      if (candidate.anonymizedAt) throw this.anonymized();

      const now = new Date();
      await manager.update(Application, id, { status: REOPEN_TO, statusChangedAt: now });
      await manager.insert(ApplicationStatusHistory, {
        applicationId: id,
        fromStatus: app.status,
        toStatus: REOPEN_TO,
        reason,
        changedBy: user.id,
        changedAt: now,
      });
      await this.audit.record(
        {
          actorId: user.id,
          action: AuditAction.ApplicationStatusChanged,
          entity: AuditEntity.Application,
          entityId: id,
          metadata: { from: app.status, to: REOPEN_TO, reason, reopen: true },
        },
        manager,
      );
    });
    this.events.emit('application.changed', { applicationId: id });
    return this.findOne(id, user);
  }

  // F-FILE-02, BR-FILE-04
  async enterCvText(
    id: string,
    dto: CvTextDto,
    user: ScopeUser,
    requestId?: string,
  ): Promise<ApplicationDetailView> {
    await this.findWritable(id, user);
    const cvFileId = await this.dataSource.transaction(async (manager) => {
      const app = await manager.findOneBy(Application, { id });
      if (!app) throw new NotFoundException('Application not found');
      const candidate = await manager.findOneByOrFail(Candidate, { id: app.candidateId });
      if (candidate.anonymizedAt) throw this.anonymized();
      const cv = app.cvFileId
        ? await manager.findOne(CvFile, {
            where: { id: app.cvFileId },
            lock: { mode: 'pessimistic_write' },
          })
        : null;
      if (!cv || cv.parseStatus !== CvParseStatus.Failed) {
        throw new BusinessException(
          ErrorCode.CvTextNotEditable,
          'CV text can only be entered when the CV file could not be read',
          HttpStatus.CONFLICT,
        );
      }

      await manager.update(CvFile, cv.id, {
        text: dto.text,
        parseStatus: CvParseStatus.Parsed,
        parseError: null,
        textEnteredAt: new Date(),
        textEnteredBy: user.id,
      });
      await this.audit.record(
        {
          actorId: user.id,
          action: AuditAction.CvTextEntered,
          entity: AuditEntity.Application,
          entityId: id,
          metadata: { cvFileId: cv.id, length: dto.text.length },
        },
        manager,
      );
      await manager.update(
        Application,
        { cvFileId: cv.id, aiStatus: AiStatus.Failed },
        { aiStatus: AiStatus.Pending, aiError: null },
      );
      return cv.id;
    });
    this.events.emit('application.changed', { applicationId: id });
    await this.pipeline.enqueueCv(cvFileId, requestId);
    return this.findOne(id, user);
  }

  // US-15, BR-APP-10
  async uploadForCandidate(
    jobId: string,
    dto: HrUploadDto,
    file: UploadedCv | undefined,
    user: ScopeUser,
    requestId?: string,
  ): Promise<ApplicationDetailView> {
    const job = await this.dataSource.getRepository(Job).findOneBy({ id: jobId });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.Open) {
      throw new BusinessException(ErrorCode.JobNotOpen, 'Job is not open', HttpStatus.CONFLICT);
    }
    const applicationId = await this.submit(
      jobId,
      { fullName: dto.fullName, email: dto.email, phone: dto.phone },
      file,
      { source: ApplicationSource.HrUpload, consentVersion: HR_CONSENT_VERSION, by: user.id },
    );
    const view = await this.findOne(applicationId, user);
    // Kickoff 12: cv.uploaded
    await this.pipeline.enqueueApplication(applicationId, requestId);
    return view;
  }

  // US-03, BR-APP-01 → 08
  async applyPublic(
    jobId: string,
    dto: PublicApplyDto,
    file: UploadedCv | undefined,
    requestId?: string,
  ): Promise<null> {
    const open = await this.dataSource
      .getRepository(Job)
      .existsBy({ id: jobId, status: JobStatus.Open });
    if (!open) throw new NotFoundException('Job not found');
    // BR-APP-06
    if (dto.website) return null;
    const applicationId = await this.submit(
      jobId,
      { fullName: dto.fullName, email: dto.email, phone: dto.phone },
      file,
      { source: ApplicationSource.PublicForm, consentVersion: PUBLIC_CONSENT_VERSION, by: null },
    );
    // Kickoff 12: cv.uploaded
    await this.pipeline.enqueueApplication(applicationId, requestId);
    // BR-APP-07
    return null;
  }

  // BR-CAND-01, 02, BR-APP-03, BR-FILE-01, 02, Kickoff 13
  private async submit(
    jobId: string,
    contact: { fullName: string; email: string; phone?: string },
    file: UploadedCv | undefined,
    opts: { source: ApplicationSource; consentVersion: string; by: string | null },
  ): Promise<string> {
    const cv = checkCv(file);
    const known = await this.candidatesService.findByEmail(contact.email);
    const reusable = await this.filesService.findReusable(
      this.dataSource.manager,
      known?.id,
      cv.sha256,
    );
    const storageKey = reusable ? null : await this.filesService.store(cv);

    let result: { applicationId: string; storedUnused: boolean };
    try {
      result = await this.dataSource.transaction(async (manager) => {
        const candidate = await this.candidatesService.upsertForApplication(
          manager,
          contact,
          opts.consentVersion,
        );
        await this.assertNotApplied(manager, jobId, candidate.id);
        const reused = await this.filesService.findReusable(manager, candidate.id, cv.sha256);
        const cvFile =
          reused ?? (await this.filesService.createRecord(manager, candidate.id, cv, storageKey!));
        const id = await this.createApplication(manager, {
          jobId,
          candidateId: candidate.id,
          cvFileId: cvFile.id,
          source: opts.source,
          changedBy: opts.by,
        });
        return { applicationId: id, storedUnused: !!(reused && storageKey) };
      });
    } catch (error) {
      if (storageKey) await this.filesService.removeStored(storageKey);
      throw this.duplicateOr(error);
    }
    // Kickoff 13
    if (result.storedUnused)
      await this.filesService.removeStored(storageKey!).catch(() => undefined);
    return result.applicationId;
  }

  // F-MATCH-02, BR-MATCH-03
  async createInvited(
    manager: EntityManager,
    input: { jobId: string; candidateId: string; cvFileId: string; by: string },
  ): Promise<string> {
    await this.assertNotApplied(manager, input.jobId, input.candidateId);
    return this.createApplication(manager, {
      jobId: input.jobId,
      candidateId: input.candidateId,
      cvFileId: input.cvFileId,
      source: ApplicationSource.MatchInvite,
      changedBy: input.by,
    });
  }

  // BR-APP-08
  private async createApplication(
    manager: EntityManager,
    input: {
      jobId: string;
      candidateId: string;
      cvFileId: string;
      source: ApplicationSource;
      changedBy: string | null;
    },
  ): Promise<string> {
    const app = await manager.save(
      manager.create(Application, {
        jobId: input.jobId,
        candidateId: input.candidateId,
        cvFileId: input.cvFileId,
        source: input.source,
        status: ApplicationStatus.New,
        aiStatus: AiStatus.Pending,
      }),
    );
    await manager.insert(ApplicationStatusHistory, {
      applicationId: app.id,
      fromStatus: null,
      toStatus: ApplicationStatus.New,
      reason: null,
      changedBy: input.changedBy,
    });
    return app.id;
  }

  // BR-STS-06, BR-STS-07
  private async transition(
    id: string,
    to: ApplicationStatus,
    reason: string | null,
    user: ScopeUser,
    requiredFrom?: ApplicationStatus,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const app = await manager.findOne(Application, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!app) throw new NotFoundException('Application not found');
      if (requiredFrom && app.status !== requiredFrom) {
        throw new BusinessException(
          ErrorCode.InvalidStatusTransition,
          `Cannot move application from ${app.status} to ${to}`,
          HttpStatus.CONFLICT,
        );
      }
      assertTransition(app.status, to, reason);
      const now = new Date();
      await manager.update(Application, id, { status: to, statusChangedAt: now });
      await manager.insert(ApplicationStatusHistory, {
        applicationId: id,
        fromStatus: app.status,
        toStatus: to,
        reason: reason?.trim() || null,
        changedBy: user.id,
        changedAt: now,
      });
      await this.audit.record(
        {
          actorId: user.id,
          action: AuditAction.ApplicationStatusChanged,
          entity: AuditEntity.Application,
          entityId: id,
          metadata: { from: app.status, to, reason: reason?.trim() || null },
        },
        manager,
      );
    });
    this.events.emit('application.changed', { applicationId: id });
  }

  private listQuery(user: ScopeUser): SelectQueryBuilder<Application> {
    const qb = this.applicationsRepository
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .innerJoin('app.candidate', 'candidate')
      .select([
        'app.id',
        'app.jobId',
        'app.status',
        'app.aiStatus',
        'app.score',
        'app.flags',
        'app.createdAt',
        'job.id',
        'job.title',
        'candidate.id',
        'candidate.fullName',
        'candidate.email',
      ]);
    return applyDepartmentScope(qb, user, 'job.departmentId');
  }

  // BR-ACC-07
  private async findReadable(id: string, user: ScopeUser): Promise<void> {
    const exists = await this.listQuery(user).andWhere('app.id = :id', { id }).getExists();
    if (!exists) throw new NotFoundException('Application not found');
  }

  // BR-ACC-07
  private async findWritable(id: string, user: ScopeUser): Promise<void> {
    const app = await this.applicationsRepository
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .select(['app.id', 'job.id', 'job.departmentId'])
      .where('app.id = :id', { id })
      .getOne();
    if (!app) throw new NotFoundException('Application not found');
    if (user.role === Role.HiringManager && app.job!.departmentId !== user.departmentId) {
      throw new ForbiddenException({
        code: ErrorCode.ScopeForbidden,
        message: 'Application is outside your department',
      });
    }
  }

  // BR-APP-03
  private async assertNotApplied(manager: EntityManager, jobId: string, candidateId: string) {
    if (await manager.existsBy(Application, { jobId, candidateId })) throw this.duplicate();
  }

  private duplicateOr(error: unknown): unknown {
    const pg =
      error instanceof QueryFailedError ? (error.driverError as { constraint?: string }) : null;
    return pg?.constraint === 'UQ_applications_job_id_candidate_id' ? this.duplicate() : error;
  }

  private anonymized() {
    return new BusinessException(
      ErrorCode.CandidateAnonymized,
      'Candidate has been anonymized',
      HttpStatus.CONFLICT,
    );
  }

  private duplicate() {
    return new BusinessException(
      ErrorCode.ApplicationDuplicated,
      'Candidate already applied to this job',
      HttpStatus.CONFLICT,
      [{ field: 'email', messages: ['Ứng viên đã có hồ sơ cho vị trí này'] }],
    );
  }

  private toListItem(a: Application): ApplicationListItemView {
    return {
      id: a.id,
      status: a.status,
      aiStatus: a.aiStatus,
      score: a.score,
      flags: a.flags,
      createdAt: a.createdAt,
      candidate: {
        id: a.candidate!.id,
        fullName: a.candidate!.fullName,
        email: a.candidate!.email,
      },
      job: { id: a.job!.id, title: a.job!.title },
    };
  }

  private toNote(n: ApplicationNote) {
    return {
      id: n.id,
      content: n.content,
      author: { id: n.author!.id, fullName: n.author!.fullName },
      createdAt: n.createdAt,
    };
  }
}
