import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, In } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { applyDepartmentScope } from '../../common/utils/department-scope.js';
import { Application } from '../applications/entities/application.entity.js';
import { JobRequirement } from '../jobs/entities/job-requirement.entity.js';
import { NotificationType } from '../notifications/entities/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/entities/user.entity.js';
import {
  CancelInterviewDto,
  FeedbackDto,
  QueryInterviewDto,
  ScheduleInterviewDto,
  UpdateInterviewDto,
} from './dto/interview.dto.js';
import { InterviewAssignee } from './entities/interview-assignee.entity.js';
import { InterviewFeedback } from './entities/interview-feedback.entity.js';
import { Interview, InterviewStatus } from './entities/interview.entity.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

export const FEEDBACK_EDIT_HOURS = 24;
const DAY_MS = 86_400_000;
const TERMINAL = [ApplicationStatus.Hired, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn];

export interface InterviewerView {
  id: string;
  fullName: string;
  email: string;
}

export interface FeedbackView {
  id: string;
  author: { id: string; fullName: string };
  overall: number;
  ratings: { requirementId: string; label: string; score: number }[];
  comment: string | null;
  submittedAt: Date;
  editableUntil: Date;
}

export interface InterviewView {
  id: string;
  applicationId: string;
  round: number;
  scheduledAt: Date;
  durationMinutes: number;
  location: string;
  status: InterviewStatus;
  cancelReason: string | null;
  createdAt: Date;
  interviewers: (InterviewerView & { submitted: boolean })[];
  feedbacks: FeedbackView[];
  application?: {
    id: string;
    status: ApplicationStatus;
    candidate: { id: string; fullName: string };
    job: { id: string; title: string };
  };
}

@Injectable()
export class InterviewsService implements OnModuleInit {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly events: AppEvents,
  ) {}

  onModuleInit(): void {
    this.events.on('application.changed', ({ applicationId }) =>
      this.cancelForClosedApplication(applicationId),
    );
  }

  // F-INT-01
  interviewers(): Promise<InterviewerView[]> {
    return this.dataSource.getRepository(User).find({
      select: ['id', 'fullName', 'email'],
      where: { role: Role.Interviewer, isActive: true },
      order: { fullName: 'ASC' },
    });
  }

  // F-INT-01, F-INT-02
  async list(query: QueryInterviewDto, user: ScopeUser): Promise<InterviewView[]> {
    const from = query.from ? new Date(query.from) : new Date(Date.now() - DAY_MS);
    const to = query.to ? new Date(query.to) : new Date(Date.now() + 30 * DAY_MS);
    const qb = this.dataSource
      .getRepository(Interview)
      .createQueryBuilder('iv')
      .innerJoin('iv.application', 'app')
      .innerJoin('app.job', 'job')
      .select('iv.id', 'id')
      .where('iv.scheduledAt >= :from AND iv.scheduledAt < :to', { from, to })
      .orderBy('iv.scheduledAt', 'ASC')
      .limit(500);
    if (!query.includeCancelled) {
      qb.andWhere('iv.status <> :cancelled', { cancelled: InterviewStatus.Cancelled });
    }
    if (query.mine || user.role === Role.Interviewer) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM interview_assignees ia WHERE ia.interview_id = iv.id AND ia.user_id = :me)',
        { me: user.id },
      );
    }
    applyDepartmentScope(qb, user, 'job.departmentId', { applicationIdColumn: '"app"."id"' });
    const ids = (await qb.getRawMany<{ id: string }>()).map((r) => r.id);
    return this.views(ids, user, true);
  }

  // F-INT-01, BR-INT-02
  async forApplication(applicationId: string, user: ScopeUser): Promise<InterviewView[]> {
    await this.readableApplication(applicationId, user);
    const rows = await this.dataSource.getRepository(Interview).find({
      select: ['id'],
      where: { applicationId },
      order: { scheduledAt: 'ASC' },
    });
    const ids = rows.map((r) => r.id);
    if (user.role === Role.Interviewer) {
      const mine = await this.dataSource.getRepository(InterviewAssignee).findBy({
        interviewId: In(ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
        userId: user.id,
      });
      const allowed = new Set(mine.map((m) => m.interviewId));
      return this.views(
        ids.filter((id) => allowed.has(id)),
        user,
        false,
      );
    }
    return this.views(ids, user, false);
  }

  // F-INT-01, BR-INT-01
  async schedule(
    applicationId: string,
    dto: ScheduleInterviewDto,
    user: ScopeUser,
  ): Promise<InterviewView> {
    this.assertFuture(dto.scheduledAt);
    const id = await this.dataSource.transaction(async (manager) => {
      const app = await manager.findOne(Application, {
        where: { id: applicationId },
        relations: { candidate: true },
        lock: { mode: 'pessimistic_write', tables: ['applications'] },
      });
      if (!app) throw new NotFoundException('Application not found');
      if (app.candidate?.anonymizedAt) {
        throw new BusinessException(
          ErrorCode.CandidateAnonymized,
          'Candidate has been anonymized',
          HttpStatus.CONFLICT,
        );
      }
      if (app.status !== ApplicationStatus.Interview) {
        throw new BusinessException(
          ErrorCode.InterviewNotAllowed,
          `Interviews can only be scheduled while the application is INTERVIEW (current: ${app.status})`,
          HttpStatus.CONFLICT,
        );
      }
      await this.assertInterviewers(manager, dto.interviewerIds);
      const start = new Date(dto.scheduledAt);
      await this.assertNoConflict(manager, dto.interviewerIds, start, dto.durationMinutes, null);

      const round =
        (await manager.countBy(Interview, {
          applicationId,
          status: In([InterviewStatus.Scheduled, InterviewStatus.Completed]),
        })) + 1;
      const saved = await manager.save(
        manager.create(Interview, {
          applicationId,
          round: Math.min(round, 20),
          scheduledAt: start,
          durationMinutes: dto.durationMinutes,
          location: dto.location,
          createdBy: user.id,
        }),
      );
      await manager.insert(
        InterviewAssignee,
        dto.interviewerIds.map((userId) => ({ interviewId: saved.id, userId })),
      );
      return saved.id;
    });
    await this.notifySafely(
      dto.interviewerIds,
      NotificationType.InterviewAssigned,
      applicationId,
      id,
    );
    return (await this.views([id], user, true))[0];
  }

  // F-INT-01, BR-INT-01
  async update(id: string, dto: UpdateInterviewDto, user: ScopeUser): Promise<InterviewView> {
    if (dto.scheduledAt) this.assertFuture(dto.scheduledAt);
    const result = await this.dataSource.transaction(async (manager) => {
      const iv = await this.lockEditable(manager, id);
      const before = await manager.findBy(InterviewAssignee, { interviewId: id });
      const beforeIds = before.map((a) => a.userId);
      const interviewerIds = dto.interviewerIds ?? beforeIds;
      if (dto.interviewerIds) await this.assertInterviewers(manager, dto.interviewerIds);

      const start = dto.scheduledAt ? new Date(dto.scheduledAt) : iv.scheduledAt;
      const duration = dto.durationMinutes ?? iv.durationMinutes;
      await this.assertNoConflict(manager, interviewerIds, start, duration, id);

      await manager.update(Interview, id, {
        scheduledAt: start,
        durationMinutes: duration,
        location: dto.location ?? iv.location,
      });
      const added = interviewerIds.filter((u) => !beforeIds.includes(u));
      const removed = beforeIds.filter((u) => !interviewerIds.includes(u));
      if (removed.length)
        await manager.delete(InterviewAssignee, { interviewId: id, userId: In(removed) });
      if (added.length) {
        await manager.insert(
          InterviewAssignee,
          added.map((userId) => ({ interviewId: id, userId })),
        );
      }
      const timeChanged =
        start.getTime() !== iv.scheduledAt.getTime() ||
        duration !== iv.durationMinutes ||
        (dto.location !== undefined && dto.location !== iv.location);
      const kept = interviewerIds.filter((u) => beforeIds.includes(u));
      return { applicationId: iv.applicationId, added, removed, kept: timeChanged ? kept : [] };
    });
    await this.notifySafely(
      result.added,
      NotificationType.InterviewAssigned,
      result.applicationId,
      id,
    );
    await this.notifySafely(
      result.removed,
      NotificationType.InterviewCancelled,
      result.applicationId,
      id,
    );
    await this.notifySafely(
      result.kept,
      NotificationType.InterviewUpdated,
      result.applicationId,
      id,
    );
    return (await this.views([id], user, true))[0];
  }

  // F-INT-01
  async cancel(id: string, dto: CancelInterviewDto, user: ScopeUser): Promise<InterviewView> {
    const { applicationId, assignees } = await this.dataSource.transaction(async (manager) => {
      const iv = await this.lockEditable(manager, id, true);
      await manager.update(Interview, id, {
        status: InterviewStatus.Cancelled,
        cancelReason: dto.reason,
      });
      const rows = await manager.findBy(InterviewAssignee, { interviewId: id });
      return { applicationId: iv.applicationId, assignees: rows.map((a) => a.userId) };
    });
    await this.notifySafely(assignees, NotificationType.InterviewCancelled, applicationId, id);
    return (await this.views([id], user, true))[0];
  }

  // F-INT-03, BR-INT-03
  async submitFeedback(id: string, dto: FeedbackDto, user: ScopeUser): Promise<FeedbackView> {
    const { feedbackId, first, notifyTo, applicationId } = await this.dataSource.transaction(
      async (manager) => {
        const iv = await manager.findOne(Interview, {
          where: { id },
          relations: { application: { job: true } },
          lock: { mode: 'pessimistic_write', tables: ['interviews'] },
        });
        const assigned =
          iv && (await manager.existsBy(InterviewAssignee, { interviewId: id, userId: user.id }));
        if (!iv || !assigned) throw new NotFoundException('Interview not found');
        if (iv.status === InterviewStatus.Cancelled) {
          throw new BusinessException(
            ErrorCode.InterviewNotEditable,
            'Interview was cancelled',
            HttpStatus.CONFLICT,
          );
        }
        if (iv.scheduledAt.getTime() > Date.now()) {
          throw new BusinessException(
            ErrorCode.InterviewNotStarted,
            'Feedback opens when the interview starts',
            HttpStatus.CONFLICT,
          );
        }
        const ratings = await this.checkRatings(manager, iv.application!, dto);
        const existing = await manager.findOneBy(InterviewFeedback, {
          interviewId: id,
          authorId: user.id,
        });
        const now = new Date();
        let feedbackId: string;
        if (existing) {
          if (existing.editableUntil.getTime() < now.getTime()) {
            throw new BusinessException(
              ErrorCode.FeedbackLocked,
              `Feedback can only be edited within ${FEEDBACK_EDIT_HOURS} hours`,
              HttpStatus.CONFLICT,
            );
          }
          await manager.update(InterviewFeedback, existing.id, {
            overall: dto.overall,
            ratings,
            comment: dto.comment || null,
          });
          feedbackId = existing.id;
        } else {
          const saved = await manager.save(
            manager.create(InterviewFeedback, {
              interviewId: id,
              authorId: user.id,
              overall: dto.overall,
              ratings,
              comment: dto.comment || null,
              editableUntil: new Date(now.getTime() + FEEDBACK_EDIT_HOURS * 3_600_000),
            }),
          );
          feedbackId = saved.id;
        }
        const [assignees, submitted] = await Promise.all([
          manager.countBy(InterviewAssignee, { interviewId: id }),
          manager.countBy(InterviewFeedback, { interviewId: id }),
        ]);
        if (submitted >= assignees && iv.status === InterviewStatus.Scheduled) {
          await manager.update(Interview, id, { status: InterviewStatus.Completed });
        }
        return {
          feedbackId,
          first: !existing,
          notifyTo: [iv.createdBy, iv.application!.job!.createdBy],
          applicationId: iv.applicationId,
        };
      },
    );
    if (first) {
      const recipients = await this.dataSource.getRepository(User).find({
        select: ['id'],
        where: { id: In(notifyTo), isActive: true, role: In([Role.Admin, Role.Hr]) },
      });
      await this.notifySafely(
        recipients.map((r) => r.id),
        NotificationType.FeedbackSubmitted,
        applicationId,
        id,
      );
    }
    const view = (await this.views([id], user, false))[0];
    return view.feedbacks.find((f) => f.id === feedbackId)!;
  }

  // BR-INT-01: hồ sơ kết thúc thì huỷ các buổi chưa diễn ra
  async cancelForClosedApplication(applicationId: string): Promise<number> {
    const app = await this.dataSource
      .getRepository(Application)
      .findOne({ select: ['id', 'status'], where: { id: applicationId } });
    if (!app || !TERMINAL.includes(app.status)) return 0;
    const pending = await this.dataSource.getRepository(Interview).find({
      select: ['id'],
      where: { applicationId, status: InterviewStatus.Scheduled },
    });
    for (const { id } of pending) {
      const assignees = await this.dataSource.transaction(async (manager) => {
        const res = await manager.update(
          Interview,
          { id, status: InterviewStatus.Scheduled },
          { status: InterviewStatus.Cancelled, cancelReason: `Hồ sơ đã chuyển sang ${app.status}` },
        );
        if (!res.affected) return [];
        return (await manager.findBy(InterviewAssignee, { interviewId: id })).map((a) => a.userId);
      });
      await this.notifySafely(assignees, NotificationType.InterviewCancelled, applicationId, id);
    }
    return pending.length;
  }

  // ---------- helpers ----------

  private assertFuture(iso: string) {
    if (new Date(iso).getTime() <= Date.now()) {
      throw new BusinessException(
        ErrorCode.ValidationFailed,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        [{ field: 'scheduledAt', messages: ['Thời gian phỏng vấn phải ở tương lai'] }],
      );
    }
  }

  private async assertInterviewers(manager: EntityManager, ids: string[]) {
    const found = await manager.find(User, {
      select: ['id'],
      where: { id: In(ids), role: Role.Interviewer, isActive: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (found.length !== ids.length) {
      throw new BusinessException(
        ErrorCode.ValidationFailed,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        [
          {
            field: 'interviewerIds',
            messages: ['Chỉ phân công người dùng có vai trò Interviewer đang hoạt động'],
          },
        ],
      );
    }
  }

  // BR-INT-01: một Interviewer không có hai buổi chồng giờ
  private async assertNoConflict(
    manager: EntityManager,
    interviewerIds: string[],
    start: Date,
    durationMinutes: number,
    exceptId: string | null,
  ) {
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const qb = manager
      .getRepository(Interview)
      .createQueryBuilder('iv')
      .innerJoin(InterviewAssignee, 'ia', 'ia.interviewId = iv.id')
      .innerJoin(User, 'u', 'u.id = ia.userId')
      .select('u.fullName', 'fullName')
      .where('ia.userId IN (:...ids)', { ids: interviewerIds })
      .andWhere('iv.status = :scheduled', { scheduled: InterviewStatus.Scheduled })
      .andWhere(
        new Brackets((b) =>
          b
            .where('iv.scheduledAt < :end', { end })
            .andWhere(`iv.scheduledAt + make_interval(mins => iv.durationMinutes) > :start`, {
              start,
            }),
        ),
      );
    if (exceptId) qb.andWhere('iv.id <> :exceptId', { exceptId });
    const clashes = await qb.getRawMany<{ fullName: string }>();
    if (clashes.length) {
      throw new BusinessException(
        ErrorCode.InterviewConflict,
        'An interviewer already has an interview at that time',
        HttpStatus.CONFLICT,
        [
          {
            field: 'interviewerIds',
            messages: [`Trùng lịch: ${[...new Set(clashes.map((c) => c.fullName))].join(', ')}`],
          },
        ],
      );
    }
  }

  private async lockEditable(manager: EntityManager, id: string, allowWithFeedback = false) {
    const iv = await manager.findOne(Interview, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!iv) throw new NotFoundException('Interview not found');
    const hasFeedback = await manager.existsBy(InterviewFeedback, { interviewId: id });
    if (iv.status !== InterviewStatus.Scheduled || (hasFeedback && !allowWithFeedback)) {
      throw new BusinessException(
        ErrorCode.InterviewNotEditable,
        'Only scheduled interviews without feedback can be changed',
        HttpStatus.CONFLICT,
      );
    }
    return iv;
  }

  private async checkRatings(manager: EntityManager, app: Application, dto: FeedbackDto) {
    const requirements = await manager.find(JobRequirement, {
      select: ['id', 'label'],
      where: { jobId: app.jobId, jdVersion: app.job!.jdVersion },
      order: { position: 'ASC' },
    });
    const given = new Map(dto.ratings.map((r) => [r.requirementId, r.score]));
    const missing = requirements.filter((r) => !given.has(r.id));
    const unknown = dto.ratings.filter((r) => !requirements.some((q) => q.id === r.requirementId));
    if (missing.length || unknown.length || given.size !== dto.ratings.length) {
      throw new BusinessException(
        ErrorCode.ValidationFailed,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        [{ field: 'ratings', messages: ['Chấm đủ mỗi tiêu chí của tin đúng một lần'] }],
      );
    }
    return requirements.map((r) => ({
      requirementId: r.id,
      label: r.label,
      score: given.get(r.id)!,
    }));
  }

  private async readableApplication(id: string, user: ScopeUser) {
    const qb = this.dataSource
      .getRepository(Application)
      .createQueryBuilder('app')
      .innerJoin('app.job', 'job')
      .where('app.id = :id', { id });
    const exists = await applyDepartmentScope(qb, user, 'job.departmentId', {
      applicationIdColumn: '"app"."id"',
    }).getExists();
    if (!exists) throw new NotFoundException('Application not found');
  }

  private async notifySafely(
    userIds: string[],
    type: NotificationType,
    applicationId: string,
    interviewId: string,
  ) {
    await this.notifications
      .notify(userIds, type, { applicationId, interviewId })
      .catch((error: Error) =>
        this.logger.error(`notify ${type} ${interviewId}: ${error.message}`),
      );
  }

  private async views(
    ids: string[],
    user: ScopeUser,
    withApplication: boolean,
  ): Promise<InterviewView[]> {
    if (!ids.length) return [];
    const rows = await this.dataSource
      .getRepository(Interview)
      .createQueryBuilder('iv')
      .leftJoinAndSelect('iv.assignees', 'ia')
      .leftJoin('ia.user', 'au')
      .addSelect(['au.id', 'au.fullName', 'au.email'])
      .leftJoinAndSelect('iv.feedbacks', 'fb')
      .leftJoin('fb.author', 'fa')
      .addSelect(['fa.id', 'fa.fullName'])
      .leftJoin('iv.application', 'app')
      .addSelect(['app.id', 'app.status'])
      .leftJoin('app.candidate', 'candidate')
      .addSelect(['candidate.id', 'candidate.fullName'])
      .leftJoin('app.job', 'job')
      .addSelect(['job.id', 'job.title'])
      .where('iv.id IN (:...ids)', { ids })
      .orderBy('iv.scheduledAt', 'ASC')
      .addOrderBy('au.fullName', 'ASC')
      .getMany();
    const ownOnly = user.role === Role.Interviewer;
    return rows.map((iv) => {
      const feedbacks = (iv.feedbacks ?? []).filter((f) => !ownOnly || f.authorId === user.id);
      const submitted = new Set((iv.feedbacks ?? []).map((f) => f.authorId));
      return {
        id: iv.id,
        applicationId: iv.applicationId,
        round: iv.round,
        scheduledAt: iv.scheduledAt,
        durationMinutes: iv.durationMinutes,
        location: iv.location,
        status: iv.status,
        cancelReason: iv.cancelReason,
        createdAt: iv.createdAt,
        interviewers: (iv.assignees ?? []).map((a) => ({
          id: a.user!.id,
          fullName: a.user!.fullName,
          email: a.user!.email,
          submitted: submitted.has(a.userId),
        })),
        feedbacks: feedbacks.map((f) => ({
          id: f.id,
          author: { id: f.author!.id, fullName: f.author!.fullName },
          overall: f.overall,
          ratings: f.ratings,
          comment: f.comment,
          submittedAt: f.submittedAt,
          editableUntil: f.editableUntil,
        })),
        ...(withApplication && {
          application: {
            id: iv.application!.id,
            status: iv.application!.status,
            candidate: {
              id: iv.application!.candidate!.id,
              fullName: iv.application!.candidate!.fullName,
            },
            job: { id: iv.application!.job!.id, title: iv.application!.job!.title },
          },
        }),
      };
    });
  }
}
