import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE } from '../ai/pipeline/queues.js';
import { MaintenanceService } from './maintenance.service.js';
import type { MaintenanceTask } from './maintenance.tasks.js';

@Processor(QUEUE.maintenance, { concurrency: 1 })
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private readonly maintenance: MaintenanceService) {
    super();
  }

  process(job: Job): Promise<number> {
    return this.maintenance.run(job.name as MaintenanceTask);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    this.logger.warn(
      `${QUEUE.maintenance}#${job.id} ${job.name} attempt ${job.attemptsMade}/${job.opts.attempts ?? 1} failed: ${error.message}`,
    );
  }
}
