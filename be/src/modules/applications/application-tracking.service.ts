import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager, MoreThan } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { AuthToken, AuthTokenKind } from '../auth/entities/auth-token.entity.js';
import { EmailService } from '../email/email.service.js';
import { EmailTemplate } from '../email/email.types.js';
import { hashToken } from '../refresh-tokens/refresh-tokens.service.js';
import { assertTransition, stageSeconds } from './application-status.js';
import { ApplicationStatusHistory } from './entities/application-status-history.entity.js';
import { Application } from './entities/application.entity.js';

export const TRACK_TOKEN_TTL_MS = 90 * 24 * 3_600_000;
export const WITHDRAW_REASON = 'Ứng viên tự rút';

// KH MVP 3 mục 9.4
export type TrackStage = 'RECEIVED' | 'REVIEWING' | 'INTERVIEW' | 'DECIDED' | 'WITHDRAWN';

const S = ApplicationStatus;
const STAGE: Record<ApplicationStatus, TrackStage> = {
  [S.New]: 'RECEIVED',
  [S.Screening]: 'REVIEWING',
  [S.Interview]: 'INTERVIEW',
  [S.Offer]: 'DECIDED',
  [S.Hired]: 'DECIDED',
  [S.Rejected]: 'DECIDED',
  [S.Withdrawn]: 'WITHDRAWN',
};
// BR-APP-14: OFFER gộp vào "Đã có kết quả" nên không cho rút qua link, tránh lộ kết quả
const WITHDRAWABLE: readonly ApplicationStatus[] = [S.New, S.Screening, S.Interview];

export interface TrackView {
  jobTitle: string;
  companyName: string;
  companySlug: string;
  appliedAt: Date;
  stage: TrackStage;
  withdrawable: boolean;
}

const tokenInvalid = () =>
  new BusinessException(
    ErrorCode.TokenInvalid,
    'Tracking link is invalid or expired',
    HttpStatus.BAD_REQUEST,
  );

// MVP 3 · F-APP-12, BR-APP-14
@Injectable()
export class ApplicationTrackingService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly email: EmailService,
    private readonly events: AppEvents,
    private readonly audit: AuditService,
  ) {}

  async issue(
    manager: EntityManager,
    input: {
      applicationId: string;
      organizationId: string;
      to: string;
      fullName: string;
      jobTitle: string;
      companyName: string;
    },
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await manager.insert(AuthToken, {
      kind: AuthTokenKind.TrackApplication,
      tokenHash: hashToken(token),
      applicationId: input.applicationId,
      expiresAt: new Date(Date.now() + TRACK_TOKEN_TTL_MS),
    });
    return this.email.enqueue(
      {
        organizationId: input.organizationId,
        to: input.to,
        template: EmailTemplate.ApplicationReceived,
        payload: {
          fullName: input.fullName,
          jobTitle: input.jobTitle,
          companyName: input.companyName,
          token,
        },
      },
      manager,
    );
  }

  dispatch(outboxId: string): Promise<void> {
    return this.email.dispatch([outboxId]);
  }

  async track(token: string): Promise<TrackView> {
    const app = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .innerJoin(
        AuthToken,
        't',
        't.application_id = a.id AND t.token_hash = :hash AND t.kind = :kind AND t.expires_at > now()',
        { hash: hashToken(token), kind: AuthTokenKind.TrackApplication },
      )
      .innerJoin('a.job', 'j')
      .innerJoin('j.organization', 'o')
      .select(['a.status AS status', 'a.created_at AS "appliedAt"'])
      .addSelect(['j.title AS "jobTitle"', 'o.name AS "companyName"', 'o.slug AS "companySlug"'])
      .where('a.deleted_at IS NULL')
      .getRawOne<{
        status: ApplicationStatus;
        appliedAt: Date;
        jobTitle: string;
        companyName: string;
        companySlug: string;
      }>();
    if (!app) throw tokenInvalid();
    return {
      jobTitle: app.jobTitle,
      companyName: app.companyName,
      companySlug: app.companySlug,
      appliedAt: app.appliedAt,
      stage: STAGE[app.status],
      withdrawable: WITHDRAWABLE.includes(app.status),
    };
  }

  async withdraw(token: string): Promise<TrackView> {
    const id = await this.dataSource.transaction(async (manager) => {
      const row = await manager.findOne(AuthToken, {
        select: { applicationId: true },
        where: {
          tokenHash: hashToken(token),
          kind: AuthTokenKind.TrackApplication,
          expiresAt: MoreThan(new Date()),
        },
      });
      if (!row?.applicationId) throw tokenInvalid();
      const app = await manager.findOne(Application, {
        where: { id: row.applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!app) throw new NotFoundException('Application not found');
      if (!WITHDRAWABLE.includes(app.status)) {
        throw new BusinessException(
          ErrorCode.ApplicationNotWithdrawable,
          `Cannot withdraw an application in ${app.status}`,
          HttpStatus.CONFLICT,
        );
      }
      assertTransition(app.status, S.Withdrawn, WITHDRAW_REASON);
      const now = new Date();
      await manager.update(Application, app.id, { status: S.Withdrawn, statusChangedAt: now });
      await manager.insert(ApplicationStatusHistory, {
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: S.Withdrawn,
        reason: WITHDRAW_REASON,
        changedBy: null,
        changedAt: now,
        prevStageSeconds: stageSeconds(app.statusChangedAt, now),
      });
      await this.audit.record(
        {
          organizationId: app.organizationId,
          actorId: null,
          action: AuditAction.ApplicationStatusChanged,
          entity: AuditEntity.Application,
          entityId: app.id,
          metadata: { from: app.status, to: S.Withdrawn, hasReason: true, by: 'candidate' },
        },
        manager,
      );
      return app.id;
    });
    this.events.emit('application.changed', { applicationId: id });
    return this.track(token);
  }
}
