import { Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CursorResult } from '../../common/dto/cursor-result.dto.js';
import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { AppEvents } from '../../common/events/app-events.js';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.js';
import { Application } from '../applications/entities/application.entity.js';
import { User } from '../users/entities/user.entity.js';
import { QueryNotificationDto } from './dto/query-notification.dto.js';
import { Notification, NotificationType } from './entities/notification.entity.js';
import { RealtimeHub } from './realtime-hub.service.js';

export interface NotificationView {
  id: string;
  type: NotificationType;
  readAt: Date | null;
  createdAt: Date;
  application: {
    id: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    score: number | null;
    aiError: string | null;
  } | null;
  interview: {
    id: string;
    round: number;
    scheduledAt: Date;
    location: string;
    cancelReason: string | null;
  } | null;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly events: AppEvents,
    private readonly hub: RealtimeHub,
  ) {}

  onModuleInit(): void {
    this.events.on('application.ai-finished', ({ applicationId, aiStatus }) =>
      this.notifyAiFinished(applicationId, aiStatus),
    );
    this.events.on('application.changed', ({ applicationId }) =>
      this.broadcastApplication(applicationId),
    );
  }

  // US-12, BR-NOTI-01
  async notifyAiFinished(applicationId: string, aiStatus: AiStatus): Promise<number> {
    const app = await this.dataSource.getRepository(Application).findOne({
      where: { id: applicationId },
      relations: { job: true },
    });
    if (!app?.job) return 0;
    const recipients = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .where('u.isActive = true')
      .andWhere(
        '((u.id = :creator AND u.role IN (:...creatorRoles)) OR (u.role = :hm AND u.departmentId = :dept))',
        {
          creator: app.job.createdBy,
          creatorRoles: [Role.Admin, Role.Hr],
          hm: Role.HiringManager,
          dept: app.job.departmentId,
        },
      )
      .getRawMany<{ id: string }>();
    const type = aiStatus === AiStatus.Done ? NotificationType.CvScored : NotificationType.CvFailed;
    return this.notify(
      recipients.map((r) => r.id),
      type,
      { applicationId },
    );
  }

  // US-12, F-INT-01
  async notify(
    userIds: string[],
    type: NotificationType,
    target: { applicationId: string; interviewId?: string },
  ): Promise<number> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return 0;
    const saved = await this.repo.save(
      unique.map((userId) =>
        this.repo.create({
          userId,
          type,
          applicationId: target.applicationId,
          interviewId: target.interviewId ?? null,
        }),
      ),
    );
    const views = new Map((await this.views(saved.map((n) => n.id))).map((v) => [v.id, v]));
    for (const n of saved) {
      const notification = views.get(n.id);
      if (!notification) continue;
      await this.hub.publish({
        kind: 'notification',
        userId: n.userId,
        notification,
        unreadCount: await this.unreadCount(n.userId),
      });
    }
    return saved.length;
  }

  // F-NOTI-01: thay cơ chế hỏi lại trạng thái AI mỗi 3 giây
  async broadcastApplication(applicationId: string): Promise<void> {
    const app = await this.dataSource.getRepository(Application).findOne({
      select: {
        id: true,
        jobId: true,
        status: true,
        aiStatus: true,
        job: { id: true, departmentId: true },
      },
      where: { id: applicationId },
      relations: { job: true },
    });
    if (!app?.job) return;
    await this.hub.publish({
      kind: 'application',
      departmentId: app.job.departmentId,
      applicationId: app.id,
      jobId: app.jobId,
      status: app.status,
      aiStatus: app.aiStatus,
    });
  }

  async list(userId: string, query: QueryNotificationDto): Promise<CursorResult<NotificationView>> {
    const qb = this.repo
      .createQueryBuilder('n')
      .select(['n.id', 'n.createdAt'])
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .limit(query.limit + 1);
    if (query.cursor) {
      const { createdAt, id } = decodeCursor(query.cursor);
      qb.andWhere('(n.createdAt, n.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: createdAt,
        cursorId: id,
      });
    }
    const rows = await qb.getMany();
    const page = rows.slice(0, query.limit);
    const views = await this.views(page.map((n) => n.id));
    const last = page.at(-1);
    return new CursorResult(
      views,
      query.limit,
      rows.length > query.limit && last ? encodeCursor(last) : null,
    );
  }

  unreadCount(userId: string): Promise<number> {
    return this.repo.countBy({ userId, readAt: IsNull() });
  }

  async markRead(id: string, userId: string): Promise<{ unreadCount: number }> {
    const n = await this.repo.findOneBy({ id, userId });
    if (!n) throw new NotFoundException('Notification not found');
    if (!n.readAt) await this.repo.update(id, { readAt: new Date() });
    return { unreadCount: await this.unreadCount(userId) };
  }

  async markAllRead(userId: string): Promise<{ unreadCount: number }> {
    await this.repo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { unreadCount: 0 };
  }

  private async views(ids: string[]): Promise<NotificationView[]> {
    if (!ids.length) return [];
    const rows = await this.repo
      .createQueryBuilder('n')
      .leftJoin('n.application', 'app')
      .leftJoin('app.candidate', 'candidate')
      .leftJoin('app.job', 'job')
      .leftJoin('n.interview', 'iv')
      .select([
        'n.id',
        'n.type',
        'n.readAt',
        'n.createdAt',
        'app.id',
        'app.score',
        'app.aiError',
        'candidate.id',
        'candidate.fullName',
        'job.id',
        'job.title',
        'iv.id',
        'iv.round',
        'iv.scheduledAt',
        'iv.location',
        'iv.cancelReason',
      ])
      .where('n.id IN (:...ids)', { ids })
      .orderBy('n.createdAt', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .getMany();
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      readAt: n.readAt,
      createdAt: n.createdAt,
      application: n.application
        ? {
            id: n.application.id,
            candidateName: n.application.candidate!.fullName,
            jobId: n.application.job!.id,
            jobTitle: n.application.job!.title,
            score: n.application.score,
            aiError: n.application.aiError,
          }
        : null,
      interview: n.interview
        ? {
            id: n.interview.id,
            round: n.interview.round,
            scheduledAt: n.interview.scheduledAt,
            location: n.interview.location,
            cancelReason: n.interview.cancelReason,
          }
        : null,
    }));
  }
}
