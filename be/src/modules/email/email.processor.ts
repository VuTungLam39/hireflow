import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EmailService } from './email.service.js';
import { EMAIL_MAX_ATTEMPTS, EMAIL_QUEUE, type EmailJobData } from './email.types.js';

// BR-NOTI-02
@Processor(EMAIL_QUEUE, { concurrency: 2 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly email: EmailService) {
    super();
  }

  process(job: Job<EmailJobData>): Promise<void> {
    const attempts = job.opts.attempts ?? EMAIL_MAX_ATTEMPTS;
    return this.email.deliver(job.data.outboxId, job.attemptsMade + 1 >= attempts);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData> | undefined, error: Error) {
    if (!job) return;
    this.logger.warn(
      `${EMAIL_QUEUE}#${job.id} attempt ${job.attemptsMade}/${job.opts.attempts ?? 1} failed: ${error.message}`,
    );
  }
}
