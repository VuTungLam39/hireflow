import { ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThan, QueryFailedError } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { RejectReasonCode } from '../../common/enums/reject-reason-code.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { dataScope, orgIdOf } from '../../common/utils/department-scope.js';
import { vnToday } from '../../common/utils/vn-date.js';
import { ApplicationsService } from '../applications/applications.service.js';
import { Application } from '../applications/entities/application.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { NotificationType } from '../notifications/entities/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/entities/user.entity.js';
import type { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto.js';
import { Offer, OfferStatus, SalaryPeriod } from './entities/offer.entity.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId' | 'organizationId'> & { id: string };
const S = OfferStatus;
const A = ApplicationStatus;

export interface OfferView {
  id: string;
  applicationId: string;
  status: OfferStatus;
  salaryAmount: number;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  startDate: string;
  respondBy: string;
  note: string | null;
  statusReason: string | null;
  createdBy: { id: string; fullName: string };
  approvedBy: { id: string; fullName: string } | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  decidedAt: Date | null;
  createdAt: Date;
  /** Người hiện tại duyệt được offer này (BR-JOB-12, Q7) */
  canApprove: boolean;
  /** Dùng cho thư offer (BR-OFFER-05) */
  letter: { candidateName: string; jobTitle: string; companyName: string };
}

// BR-OFFER-02: trạng thái kế tiếp hợp lệ
const NEXT: Record<OfferStatus, OfferStatus[]> = {
  [S.Draft]: [S.PendingApproval, S.Withdrawn],
  [S.PendingApproval]: [S.Approved, S.Draft, S.Withdrawn],
  [S.Approved]: [S.Sent, S.Withdrawn],
  [S.Sent]: [S.Accepted, S.Declined, S.Expired],
  [S.Accepted]: [],
  [S.Declined]: [],
  [S.Withdrawn]: [],
  [S.Expired]: [],
};

const invalidTransition = (from: OfferStatus, to: OfferStatus) =>
  new BusinessException(
    ErrorCode.InvalidOfferTransition,
    `Cannot move offer from ${from} to ${to}`,
    HttpStatus.CONFLICT,
  );

const dateError = (field: string, message: string) =>
  new BusinessException(ErrorCode.ValidationFailed, 'Validation failed', HttpStatus.BAD_REQUEST, [
    { field, messages: [message] },
  ]);

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05
@Injectable()
export class OffersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly applications: ApplicationsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly events: AppEvents,
  ) {}

  // BR-OFFER-04: Interviewer không thấy offer
  async list(applicationId: string, user: ScopeUser): Promise<OfferView[]> {
    this.assertNotInterviewer(user);
    await this.applications.findOne(applicationId, user);
    const rows = await this.query()
      .where('o.applicationId = :applicationId', { applicationId })
      .orderBy('o.createdAt', 'DESC')
      .getMany();
    return rows.map((o) => this.toView(o, user));
  }

  async create(applicationId: string, dto: CreateOfferDto, user: ScopeUser): Promise<OfferView> {
    await this.applications.findOne(applicationId, user);
    this.assertDates(dto.respondBy, dto.startDate);
    const id = await this.dataSource.transaction(async (m) => {
      const app = await m.findOne(Application, {
        where: { id: applicationId, organizationId: orgIdOf(user) },
        lock: { mode: 'pessimistic_write' },
      });
      if (!app) throw new NotFoundException('Application not found');
      // BR-OFFER-01
      if (app.status !== A.Interview) {
        throw new BusinessException(
          ErrorCode.InvalidOfferTransition,
          `Offers can only be prepared for INTERVIEW applications (current: ${app.status})`,
          HttpStatus.CONFLICT,
        );
      }
      const saved = await m
        .save(
          m.create(Offer, {
            organizationId: app.organizationId,
            applicationId,
            status: S.Draft,
            salaryAmount: dto.salaryAmount,
            salaryCurrency: dto.salaryCurrency ?? 'VND',
            salaryPeriod: dto.salaryPeriod ?? SalaryPeriod.Month,
            startDate: dto.startDate,
            respondBy: dto.respondBy,
            note: dto.note || null,
            createdBy: user.id,
          }),
        )
        .catch((error: unknown) => {
          if (
            error instanceof QueryFailedError &&
            (error.driverError as { constraint?: string }).constraint ===
              'UQ_offers_application_id_active'
          ) {
            throw new BusinessException(
              ErrorCode.OfferExists,
              'This application already has an open offer',
              HttpStatus.CONFLICT,
            );
          }
          throw error;
        });
      await this.log(m, AuditAction.OfferCreated, saved, user);
      return saved.id;
    });
    return this.view(id, user);
  }

  async update(id: string, dto: UpdateOfferDto, user: ScopeUser): Promise<OfferView> {
    await this.dataSource.transaction(async (m) => {
      const offer = await this.lock(m, id, user);
      if (offer.status !== S.Draft) {
        throw new BusinessException(
          ErrorCode.InvalidOfferTransition,
          'Only DRAFT offers can be edited',
          HttpStatus.CONFLICT,
        );
      }
      const next = { ...offer, ...dto };
      this.assertDates(next.respondBy, next.startDate);
      await m.update(Offer, id, {
        salaryAmount: next.salaryAmount,
        salaryCurrency: next.salaryCurrency,
        salaryPeriod: next.salaryPeriod,
        startDate: next.startDate,
        respondBy: next.respondBy,
        note: dto.note !== undefined ? dto.note || null : offer.note,
      });
    });
    return this.view(id, user);
  }

  async submit(id: string, user: ScopeUser): Promise<OfferView> {
    const offer = await this.move(id, S.PendingApproval, user, AuditAction.OfferSubmitted);
    const approvers = await this.approversOf(offer);
    await this.notifications
      .notify(approvers, NotificationType.OfferPendingApproval, {
        applicationId: offer.applicationId,
      })
      .catch(() => 0);
    return this.view(id, user);
  }

  async approve(id: string, user: ScopeUser): Promise<OfferView> {
    const offer = await this.move(id, S.Approved, user, AuditAction.OfferApproved, {
      approvedBy: user.id,
      approvedAt: new Date(),
      statusReason: null,
    });
    await this.notifications
      .notify([offer.createdBy], NotificationType.OfferApproved, {
        applicationId: offer.applicationId,
      })
      .catch(() => 0);
    return this.view(id, user);
  }

  async returnToDraft(id: string, reason: string, user: ScopeUser): Promise<OfferView> {
    const offer = await this.move(id, S.Draft, user, AuditAction.OfferReturned, {
      statusReason: reason,
    });
    await this.notifications
      .notify([offer.createdBy], NotificationType.OfferReturned, {
        applicationId: offer.applicationId,
      })
      .catch(() => 0);
    return this.view(id, user);
  }

  // BR-OFFER-02: gửi xong hồ sơ vào OFFER
  async send(id: string, user: ScopeUser): Promise<OfferView> {
    await this.move(id, S.Sent, user, AuditAction.OfferSent, { sentAt: new Date() }, (m, o) =>
      this.applications.transitionForOffer(
        m,
        o.applicationId,
        A.Offer,
        {},
        user,
        A.Interview,
        o.id,
      ),
    );
    return this.view(id, user);
  }

  async accept(id: string, user: ScopeUser): Promise<OfferView> {
    await this.move(
      id,
      S.Accepted,
      user,
      AuditAction.OfferAccepted,
      { decidedAt: new Date() },
      (m, o) =>
        this.applications.transitionForOffer(m, o.applicationId, A.Hired, {}, user, A.Offer, o.id),
    );
    return this.view(id, user);
  }

  async decline(id: string, reason: string | undefined, user: ScopeUser): Promise<OfferView> {
    await this.move(
      id,
      S.Declined,
      user,
      AuditAction.OfferDeclined,
      { decidedAt: new Date(), statusReason: reason || null },
      (m, o) =>
        this.applications.transitionForOffer(
          m,
          o.applicationId,
          A.Rejected,
          { reasonCode: RejectReasonCode.CandidateDeclined, reason: reason || null },
          user,
          A.Offer,
          o.id,
        ),
    );
    return this.view(id, user);
  }

  // Chỉ rút trước khi gửi; đã gửi thì ghi nhận ứng viên từ chối hoặc chờ hết hạn
  async withdraw(id: string, reason: string, user: ScopeUser): Promise<OfferView> {
    await this.move(id, S.Withdrawn, user, AuditAction.OfferWithdrawn, {
      decidedAt: new Date(),
      statusReason: reason,
    });
    return this.view(id, user);
  }

  // BR-OFFER-03: maintenance gọi mỗi ngày
  async expireOverdue(): Promise<number> {
    const due = await this.dataSource.getRepository(Offer).find({
      select: { id: true },
      where: { status: S.Sent, respondBy: LessThan(vnToday()) },
    });
    let count = 0;
    for (const { id } of due) {
      const applicationId = await this.dataSource.transaction(async (m) => {
        const offer = await m.findOne(Offer, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!offer || offer.status !== S.Sent) return null;
        // hệ thống tự làm: changed_by và actor để NULL
        const system = { role: Role.Hr, departmentId: null, organizationId: offer.organizationId };
        await m.update(Offer, id, {
          status: S.Expired,
          decidedAt: new Date(),
          statusReason: 'Hết hạn trả lời',
        });
        await this.applications.transitionForOffer(
          m,
          offer.applicationId,
          A.Rejected,
          { reasonCode: RejectReasonCode.CandidateDeclined, reason: 'Hết hạn trả lời offer' },
          system,
          A.Offer,
          id,
        );
        await this.audit.record(
          {
            organizationId: offer.organizationId,
            actorId: null,
            action: AuditAction.OfferExpired,
            entity: AuditEntity.Offer,
            entityId: id,
            metadata: { applicationId: offer.applicationId },
          },
          m,
        );
        return offer.applicationId;
      });
      if (applicationId) {
        count++;
        this.events.emit('application.changed', { applicationId });
      }
    }
    return count;
  }

  private async move(
    id: string,
    to: OfferStatus,
    user: ScopeUser,
    action: AuditAction,
    patch: Partial<Offer> = {},
    after?: (m: EntityManager, offer: Offer) => Promise<void>,
  ): Promise<Offer> {
    const offer = await this.dataSource.transaction(async (m) => {
      const o = await this.lock(m, id, user);
      if (!NEXT[o.status].includes(to)) throw invalidTransition(o.status, to);
      if (to === S.Approved || (o.status === S.PendingApproval && to === S.Draft)) {
        await this.assertApprover(m, o, user);
      } else if (user.role !== Role.Admin && user.role !== Role.Hr) {
        throw new ForbiddenException('Only HR or Admin can do this');
      }
      await m.update(Offer, id, { status: to, ...patch });
      if (after) await after(m, o);
      await this.log(m, action, o, user, to);
      return o;
    });
    if (after) this.events.emit('application.changed', { applicationId: offer.applicationId });
    return offer;
  }

  // BR-JOB-12, Q7: HM phụ trách tin duyệt; tin chưa gán HM thì Admin duyệt (Admin duyệt được mọi offer)
  private async assertApprover(m: EntityManager, offer: Offer, user: ScopeUser): Promise<void> {
    if (user.role === Role.Admin) return;
    const job = await m
      .createQueryBuilder(Application, 'a')
      .innerJoin('a.job', 'j')
      .select('j.hiring_manager_id', 'hiringManagerId')
      .where('a.id = :id', { id: offer.applicationId })
      .getRawOne<{ hiringManagerId: string | null }>();
    if (user.role === Role.HiringManager && job?.hiringManagerId === user.id) return;
    throw new BusinessException(
      ErrorCode.OfferApproverRequired,
      job?.hiringManagerId
        ? 'Only the hiring manager of this job or an Admin can approve'
        : 'This job has no hiring manager: an Admin approves',
      HttpStatus.FORBIDDEN,
    );
  }

  private async approversOf(offer: Offer): Promise<string[]> {
    const row = await this.dataSource
      .createQueryBuilder(Application, 'a')
      .innerJoin('a.job', 'j')
      .select('j.hiring_manager_id', 'hiringManagerId')
      .where('a.id = :id', { id: offer.applicationId })
      .getRawOne<{ hiringManagerId: string | null }>();
    if (row?.hiringManagerId) return [row.hiringManagerId];
    const admins = await this.dataSource.getRepository(User).find({
      select: { id: true },
      where: { organizationId: offer.organizationId, role: Role.Admin, isActive: true },
    });
    return admins.map((u) => u.id);
  }

  private async lock(m: EntityManager, id: string, user: ScopeUser): Promise<Offer> {
    this.assertNotInterviewer(user);
    const offer = await m.findOne(Offer, {
      where: { id, organizationId: orgIdOf(user) },
      lock: { mode: 'pessimistic_write' },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    // phạm vi phòng ban / HM phụ trách: đọc được hồ sơ mới thao tác được offer
    await this.applications.findOne(offer.applicationId, user);
    return offer;
  }

  private assertNotInterviewer(user: ScopeUser) {
    if (dataScope(user.role) === 'assigned')
      throw new ForbiddenException('Interviewers cannot see offers');
  }

  private assertDates(respondBy?: string, startDate?: string) {
    if (!respondBy || !startDate) return;
    if (respondBy < vnToday()) throw dateError('respondBy', 'Hạn trả lời phải từ hôm nay trở đi');
    if (startDate < respondBy)
      throw dateError('startDate', 'Ngày bắt đầu không được trước hạn trả lời');
  }

  private log(
    m: EntityManager,
    action: AuditAction,
    offer: Offer,
    user: ScopeUser,
    to?: OfferStatus,
  ) {
    // BR-AUDIT-03: không ghi lương vào nhật ký
    return this.audit.record(
      {
        organizationId: offer.organizationId,
        actorId: user.id,
        action,
        entity: AuditEntity.Offer,
        entityId: offer.id,
        metadata: { applicationId: offer.applicationId, ...(to ? { from: offer.status, to } : {}) },
      },
      m,
    );
  }

  private query() {
    return this.dataSource
      .getRepository(Offer)
      .createQueryBuilder('o')
      .innerJoin('o.creator', 'creator')
      .addSelect(['creator.id', 'creator.fullName'])
      .leftJoin('o.approver', 'approver')
      .addSelect(['approver.id', 'approver.fullName'])
      .innerJoin('o.application', 'app')
      .addSelect(['app.id'])
      .innerJoin('app.candidate', 'candidate')
      .addSelect(['candidate.id', 'candidate.fullName'])
      .innerJoin('app.job', 'job')
      .addSelect(['job.id', 'job.title', 'job.hiringManagerId'])
      .innerJoin('job.organization', 'org')
      .addSelect(['org.id', 'org.name']);
  }

  private async view(id: string, user: ScopeUser): Promise<OfferView> {
    const o = await this.query().where('o.id = :id', { id }).getOneOrFail();
    return this.toView(o, user);
  }

  private toView(o: Offer, user: ScopeUser): OfferView {
    const job = o.application!.job!;
    return {
      id: o.id,
      applicationId: o.applicationId,
      status: o.status,
      salaryAmount: o.salaryAmount,
      salaryCurrency: o.salaryCurrency,
      salaryPeriod: o.salaryPeriod,
      startDate: o.startDate,
      respondBy: o.respondBy,
      note: o.note,
      statusReason: o.statusReason,
      createdBy: { id: o.creator!.id, fullName: o.creator!.fullName },
      approvedBy: o.approver ? { id: o.approver.id, fullName: o.approver.fullName } : null,
      approvedAt: o.approvedAt,
      sentAt: o.sentAt,
      decidedAt: o.decidedAt,
      createdAt: o.createdAt,
      canApprove:
        o.status === S.PendingApproval &&
        (user.role === Role.Admin ||
          (user.role === Role.HiringManager && job.hiringManagerId === user.id)),
      letter: {
        candidateName: o.application!.candidate!.fullName,
        jobTitle: job.title,
        companyName: job.organization!.name,
      },
    };
  }
}
