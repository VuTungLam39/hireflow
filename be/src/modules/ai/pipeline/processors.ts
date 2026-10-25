import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { type Job, UnrecoverableError } from 'bullmq';
import { CvPipelineService } from './cv-pipeline.service.js';
import { type CvJobData, QUEUE, type RescoreJobData, type ScoreJobData } from './queues.js';

const isFinal = (job: Job, error: Error) =>
  error instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);

const describeJob = (job: Job) => {
  const requestId = (job.data as { requestId?: string }).requestId;
  return `${job.queueName}#${job.id} attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}${requestId ? ` req=${requestId}` : ''}`;
};

@Injectable()
abstract class PipelineWorker<T> extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly pipeline: CvPipelineService) {
    super();
  }

  protected abstract onFinalFailure(data: T, error: Error): Promise<void>;

  @OnWorkerEvent('failed')
  async onFailed(job: Job<T> | undefined, error: Error) {
    if (!job) return;
    this.logger.warn(`${describeJob(job)} failed: ${error.message}`);
    if (isFinal(job, error)) await this.onFinalFailure(job.data, error);
  }
}

// Kickoff 8.1
@Processor(QUEUE.parse, { concurrency: 2 })
export class ParseCvProcessor extends PipelineWorker<CvJobData> {
  async process(job: Job<CvJobData>): Promise<void> {
    await this.pipeline.parse(job.data);
  }

  protected onFinalFailure(data: CvJobData, error: Error) {
    return this.pipeline.failCv(data.cvFileId, error);
  }
}

@Processor(QUEUE.extract, { concurrency: 2 })
export class ExtractCvProcessor extends PipelineWorker<CvJobData> {
  async process(job: Job<CvJobData>): Promise<void> {
    await this.pipeline.extract(job.data);
  }

  protected onFinalFailure(data: CvJobData, error: Error) {
    return this.pipeline.failCv(data.cvFileId, error);
  }
}

@Processor(QUEUE.score, { concurrency: 4 })
export class ScoreProcessor extends PipelineWorker<ScoreJobData | RescoreJobData> {
  async process(job: Job<ScoreJobData | RescoreJobData>): Promise<number | void> {
    if (job.name === 'rescore-job') return this.pipeline.rescoreJob(job.data as RescoreJobData);
    await this.pipeline.score(job.data as ScoreJobData);
  }

  protected async onFinalFailure(data: ScoreJobData | RescoreJobData, error: Error) {
    if ('applicationId' in data) await this.pipeline.failApplication(data.applicationId, error);
  }
}
