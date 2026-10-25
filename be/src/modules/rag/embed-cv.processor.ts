import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { type CvJobData, QUEUE } from '../ai/pipeline/queues.js';
import { RagService } from './rag.service.js';

// Kickoff 8.1: embed-cv
@Processor(QUEUE.embed, { concurrency: 1 })
export class EmbedCvProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbedCvProcessor.name);

  constructor(private readonly rag: RagService) {
    super();
  }

  process(job: Job<CvJobData>): Promise<number> {
    return this.rag.embedCv(job.data.cvFileId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<CvJobData> | undefined, error: Error) {
    if (!job) return;
    const requestId = job.data.requestId ? ` req=${job.data.requestId}` : '';
    this.logger.warn(
      `${QUEUE.embed}#${job.id} attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}${requestId} failed: ${error.message}`,
    );
  }
}
