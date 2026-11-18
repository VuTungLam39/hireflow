import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { Brackets, DataSource, type SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from '../../../common/dto/paginated-result.dto.js';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { AiStatus } from '../../../common/enums/ai-status.enum.js';
import { Application } from '../../applications/entities/application.entity.js';
import { CvPipelineService } from './cv-pipeline.service.js';
import { QUEUE } from './queues.js';
import type { AuthUser } from '../../../common/interfaces/jwt-payload.interface.js';
import { orgIdOf } from '../../../common/utils/department-scope.js';

// Backend Architecture 13
export const STUCK_PENDING_MINUTES = 5;
export const RETRY_ALL_LIMIT = 500;

export interface AiIssueView {
  id: string;
  aiStatus: AiStatus;
  aiError: string | null;
  stuck: boolean;
  createdAt: Date;
  updatedAt: Date;
  candidate: { id: string; fullName: string };
  job: { id: string; title: string };
}

export interface QueueCountsView {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

@Injectable()
export class PipelineOpsService {
  private readonly logger = new Logger(PipelineOpsService.name);
  private readonly queues: Queue[];

  constructor(
    private readonly dataSource: DataSource,
    private readonly pipeline: CvPipelineService,
    @InjectQueue(QUEUE.parse) parse: Queue,
    @InjectQueue(QUEUE.extract) extract: Queue,
    @InjectQueue(QUEUE.score) score: Queue,
    @InjectQueue(QUEUE.embed) embed: Queue,
  ) {
    this.queues = [parse, extract, score, embed];
  }

  // F-OPS-01, API Contract 4.10
  async findIssues(
    query: PaginationQueryDto,
    user: Pick<AuthUser, 'organizationId'>,
  ): Promise<PaginatedResult<AiIssueView>> {
    const [rows, total] = await this.issuesQuery(orgIdOf(user))
      .leftJoin('app.candidate', 'candidate')
      .leftJoin('app.job', 'job')
      .addSelect(['candidate.id', 'candidate.fullName', 'job.id', 'job.title'])
      .orderBy('app.updatedAt', 'DESC')
      .addOrderBy('app.id', 'DESC')
      .offset(query.skip)
      .limit(query.limit)
      .getManyAndCount();
    return new PaginatedResult(
      rows.map((a) => ({
        id: a.id,
        aiStatus: a.aiStatus,
        aiError: a.aiError,
        stuck: a.aiStatus !== AiStatus.Failed,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        candidate: { id: a.candidate!.id, fullName: a.candidate!.fullName },
        job: { id: a.job!.id, title: a.job!.title },
      })),
      total,
      query.page,
      query.limit,
    );
  }

  // BR-AI-08
  async retry(
    applicationId: string,
    user: Pick<AuthUser, 'organizationId'>,
    requestId?: string,
  ): Promise<null> {
    const exists = await this.issuesQuery(orgIdOf(user))
      .andWhere('app.id = :applicationId', { applicationId })
      .getExists();
    if (!exists) throw new NotFoundException('No failed or stuck AI job for this application');
    await this.pipeline.rescore(applicationId, requestId);
    return null;
  }

  async retryAll(
    user: Pick<AuthUser, 'organizationId'>,
    requestId?: string,
  ): Promise<{ queued: number; failed: number }> {
    const rows = await this.issuesQuery(orgIdOf(user))
      .select('app.id', 'id')
      .orderBy('app.updatedAt', 'ASC')
      .limit(RETRY_ALL_LIMIT)
      .getRawMany<{ id: string }>();
    let queued = 0;
    for (const { id } of rows) {
      try {
        await this.pipeline.rescore(id, requestId);
        queued++;
      } catch (error) {
        this.logger.warn(`retry ${id} skipped: ${(error as Error).message}`);
      }
    }
    return { queued, failed: rows.length - queued };
  }

  // Phase 5 O2
  async requeueLost(): Promise<number> {
    const rows = await this.issuesQuery()
      .andWhere('app.aiStatus != :failedStatus', { failedStatus: AiStatus.Failed })
      .innerJoin('app.job', 'job')
      .select('app.id', 'id')
      .addSelect('app.cvFileId', 'cvFileId')
      .addSelect('job.jdVersion', 'jdVersion')
      .orderBy('app.updatedAt', 'ASC')
      .limit(RETRY_ALL_LIMIT)
      .getRawMany<{ id: string; cvFileId: string; jdVersion: number }>();
    let queued = 0;
    for (const row of rows) {
      if (await this.pipeline.hasLiveJob(row)) continue;
      try {
        await this.pipeline.rescore(row.id);
        queued++;
      } catch (error) {
        this.logger.warn(`requeue ${row.id} skipped: ${(error as Error).message}`);
      }
    }
    if (queued) this.logger.warn(`Requeued ${queued} applications whose AI job was lost`);
    return queued;
  }

  async queueCounts(): Promise<QueueCountsView[]> {
    return Promise.all(
      this.queues.map(async (queue) => {
        const c = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
        return {
          name: queue.name,
          waiting: c.waiting ?? 0,
          active: c.active ?? 0,
          delayed: c.delayed ?? 0,
          failed: c.failed ?? 0,
        };
      }),
    );
  }

  private issuesQuery(organizationId?: string): SelectQueryBuilder<Application> {
    const qb = this.dataSource
      .getRepository(Application)
      .createQueryBuilder('app')
      .where('app.cvFileId IS NOT NULL');
    // BR-TEN-02
    if (organizationId) qb.andWhere('app.organizationId = :organizationId', { organizationId });
    return qb.andWhere(
      new Brackets((qb) =>
        qb
          .where('app.aiStatus = :failed', { failed: AiStatus.Failed })
          .orWhere(
            `app.aiStatus = :pending AND app.createdAt < now() - make_interval(mins => :minutes)`,
            { pending: AiStatus.Pending, minutes: STUCK_PENDING_MINUTES },
          )
          .orWhere(
            `app.aiStatus = :processing AND app.updatedAt < now() - make_interval(mins => :minutes)`,
            { processing: AiStatus.Processing, minutes: STUCK_PENDING_MINUTES },
          ),
      ),
    );
  }
}
