import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { type MatchJobData, QUEUE } from '../ai/pipeline/queues.js';
import { MatchingService } from './matching.service.js';

// Kickoff 12: job.published → match-job
@Processor(QUEUE.match, { concurrency: 1 })
export class MatchJobProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchJobProcessor.name);

  constructor(private readonly matching: MatchingService) {
    super();
  }

  process(job: Job<MatchJobData>): Promise<number> {
    return this.matching.compute(job.data);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MatchJobData> | undefined, error: Error) {
    if (!job) return;
    const requestId = job.data.requestId ? ` req=${job.data.requestId}` : '';
    this.logger.warn(
      `${QUEUE.match}#${job.id} attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}${requestId} failed: ${error.message}`,
    );
  }
}
