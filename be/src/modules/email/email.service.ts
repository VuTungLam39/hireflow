import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { EntityManager, LessThan, Repository } from 'typeorm';
import { emailConfig } from '../../config/email.config.js';
import { renderEmail } from './email.templates.js';
import {
  EMAIL_MAX_ATTEMPTS,
  EMAIL_PROVIDER,
  EMAIL_QUEUE,
  type EmailJobData,
  type EmailPayloads,
  type EmailProvider,
  type EmailTemplate,
} from './email.types.js';
import { EmailOutbox, EmailStatus } from './entities/email-outbox.entity.js';

export interface OutboxEntry<T extends EmailTemplate> {
  organizationId: string | null;
  to: string;
  template: T;
  payload: EmailPayloads[T];
}

export const STALE_PENDING_MS = 5 * 60_000;
const REQUEUE_BATCH = 200;

const withoutSecrets = (payload: Record<string, string>) => {
  const { token: _token, ...rest } = payload;
  return rest;
};

// MVP 3 · BR-NOTI-02
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailOutbox) private readonly repo: Repository<EmailOutbox>,
    @InjectQueue(EMAIL_QUEUE) private readonly queue: Queue<EmailJobData>,
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    @Inject(emailConfig.KEY) private readonly config: ConfigType<typeof emailConfig>,
  ) {}

  async enqueue<T extends EmailTemplate>(
    entry: OutboxEntry<T>,
    manager?: EntityManager,
  ): Promise<string> {
    const repo = manager ? manager.getRepository(EmailOutbox) : this.repo;
    const row = await repo.save(
      repo.create({ ...entry, payload: entry.payload as Record<string, string> }),
    );
    return row.id;
  }

  // Gọi sau khi transaction commit; lỗi Redis thì maintenance đưa lại sau
  async dispatch(ids: string[]): Promise<void> {
    for (const outboxId of ids) {
      await this.queue
        .add(
          'send',
          { outboxId },
          {
            jobId: outboxId,
            attempts: EMAIL_MAX_ATTEMPTS,
            backoff: { type: 'exponential', delay: 10_000 },
          },
        )
        .catch((error: Error) => this.logger.warn(`queue email ${outboxId}: ${error.message}`));
    }
  }

  async deliver(outboxId: string, isLastAttempt: boolean): Promise<void> {
    const row = await this.repo.findOneBy({ id: outboxId, status: EmailStatus.Pending });
    if (!row) return;
    try {
      const rendered = renderEmail(row.template, row.payload as never, this.config.appPublicUrl);
      await this.provider.send({ to: row.to, ...rendered });
      await this.repo.update(row.id, {
        status: EmailStatus.Sent,
        sentAt: new Date(),
        attempts: row.attempts + 1,
        lastError: null,
        payload: withoutSecrets(row.payload),
      });
    } catch (error) {
      const message = (error as Error).message.slice(0, 1000);
      await this.repo.update(row.id, {
        attempts: row.attempts + 1,
        lastError: message,
        ...(isLastAttempt
          ? { status: EmailStatus.Failed, payload: withoutSecrets(row.payload) }
          : {}),
      });
      throw error;
    }
  }

  async requeueStale(): Promise<number> {
    const rows = await this.repo.find({
      select: { id: true },
      where: {
        status: EmailStatus.Pending,
        createdAt: LessThan(new Date(Date.now() - STALE_PENDING_MS)),
      },
      order: { createdAt: 'ASC' },
      take: REQUEUE_BATCH,
    });
    await this.dispatch(rows.map((r) => r.id));
    return rows.length;
  }
}
