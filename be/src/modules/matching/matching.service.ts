import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { aiConfig } from '../../config/ai.config.js';
import { appConfig } from '../../config/app.config.js';
import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import type { ScoreFlag } from '../../common/enums/score-flag.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import { maskPii } from '../ai/cv-text.js';
import type { ExtractedSkill } from '../ai/scoring.js';
import { CvPipelineService } from '../ai/pipeline/cv-pipeline.service.js';
import { jobId as queueJobId, type MatchJobData, QUEUE } from '../ai/pipeline/queues.js';
import {
  ApplicationsService,
  type ApplicationDetailView,
} from '../applications/applications.service.js';
import { Candidate } from '../candidates/entities/candidate.entity.js';
import { CvParseStatus } from '../files/entities/cv-file.entity.js';
import { JobRequirement } from '../jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../jobs/entities/job.entity.js';
import { JobMatch } from './entities/job-match.entity.js';
import {
  likePatterns,
  type MatchPoolRow,
  type MatchReason,
  type MatchRequirement,
  rankMatches,
} from './match-ranking.js';

type ScopeUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

// API Contract 4.4
export interface JobMatchItemView {
  candidate: { id: string; fullName: string; email: string };
  score: number;
  flags: ScoreFlag[];
  reasons: MatchReason[];
  lastAppliedAt: Date;
  invitedAt: Date | null;
  applicationId: string | null;
}

export interface JobMatchesView {
  job: { id: string; title: string; status: JobStatus; jdVersion: number };
  computedAt: Date | null;
  computedJdVersion: number | null;
  pending: boolean;
  items: JobMatchItemView[];
}

const POOL_LIMIT = 5000;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue(QUEUE.match) private readonly queue: Queue<MatchJobData>,
    @Inject(aiConfig.KEY) private readonly ai: ConfigType<typeof aiConfig>,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
    private readonly applications: ApplicationsService,
    private readonly pipeline: CvPipelineService,
  ) {}

  // Kickoff 12: job.published, job.requirements.updated
  async enqueue(jobId: string, jdVersion: number, requestId?: string): Promise<void> {
    try {
      const id = queueJobId.match(jobId, jdVersion);
      const existing = await this.queue.getJob(id);
      if (existing && (await existing.isFailed())) await existing.remove();
      await this.queue.add('match', { jobId, jdVersion, requestId }, { jobId: id });
    } catch (error) {
      this.logger.error(`Cannot enqueue match ${jobId} v${jdVersion}: ${(error as Error).message}`);
    }
  }

  // F-MATCH-01, BR-MATCH-01, BR-MATCH-02
  async compute({ jobId, jdVersion }: MatchJobData): Promise<number> {
    const job = await this.dataSource.getRepository(Job).findOneBy({ id: jobId });
    if (!job || job.jdVersion !== jdVersion || job.status === JobStatus.Draft) return 0;

    const requirements = await this.dataSource.getRepository(JobRequirement).find({
      where: { jobId, jdVersion },
      order: { position: 'ASC' },
    });
    const keywords = requirements.flatMap((r) => r.keywords);
    const pool = keywords.length ? await this.pool(jobId, keywords) : [];
    const ranked = rankMatches(requirements as MatchRequirement[], pool, maskPii);

    await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(Job, {
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current || current.jdVersion !== jdVersion) return;
      await manager
        .createQueryBuilder()
        .delete()
        .from(JobMatch)
        .where('job_id = :jobId AND invited_at IS NULL', { jobId })
        .execute();
      if (ranked.length) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(JobMatch)
          .values(
            ranked.map((m) => ({
              jobId,
              candidateId: m.candidateId,
              cvFileId: m.cvFileId,
              jdVersion,
              score: m.score,
              scoreBreakdown: m.reasons,
              flags: m.flags,
              lastAppliedAt: m.lastAppliedAt,
            })),
          )
          .orIgnore()
          .execute();
      }
      await manager.update(Job, jobId, { matchedAt: new Date(), matchedJdVersion: jdVersion });
    });
    return ranked.length;
  }

  // BR-MATCH-01, BR-MATCH-04
  private async pool(jobId: string, keywords: string[]): Promise<MatchPoolRow[]> {
    const rows = await this.dataSource.query<
      {
        candidateId: string;
        cvFileId: string;
        text: string;
        skills: ExtractedSkill[] | null;
        lastAppliedAt: Date;
      }[]
    >(
      `SELECT latest."candidateId", latest."cvFileId", latest.text, latest.skills, latest."lastAppliedAt"
       FROM (
         SELECT DISTINCT ON (cf.candidate_id)
                cf.candidate_id AS "candidateId", cf.id AS "cvFileId", cf.text,
                p.data -> 'skills' AS skills, own.last_applied_at AS "lastAppliedAt"
         FROM cv_files cf
         JOIN candidates c ON c.id = cf.candidate_id AND c.deleted_at IS NULL AND c.anonymized_at IS NULL
         JOIN cv_profiles p ON p.cv_file_id = cf.id AND p.prompt_version = $2
         JOIN LATERAL (
           SELECT MAX(a.created_at) AS last_applied_at FROM applications a
           WHERE a.candidate_id = cf.candidate_id AND a.deleted_at IS NULL
             AND a.source <> $3::application_source_enum
         ) own ON own.last_applied_at >= now() - make_interval(months => $4)
         WHERE cf.deleted_at IS NULL AND cf.text IS NOT NULL AND cf.parse_status = $5
           AND NOT EXISTS (
             SELECT 1 FROM applications x
             WHERE x.job_id = $1 AND x.candidate_id = cf.candidate_id AND x.deleted_at IS NULL
           )
         ORDER BY cf.candidate_id, cf.created_at DESC
       ) latest
       WHERE EXISTS (
         SELECT 1 FROM jsonb_array_elements(latest.skills) s
         WHERE f_unaccent(lower(s ->> 'name')) LIKE ANY($6::text[])
       )
       ORDER BY latest."lastAppliedAt" DESC
       LIMIT ${POOL_LIMIT}`,
      [
        jobId,
        this.ai.promptVersion,
        ApplicationSource.MatchInvite,
        this.app.cvRetentionMonths,
        CvParseStatus.Parsed,
        likePatterns(keywords),
      ],
    );
    return rows.map((r) => ({
      ...r,
      skills: Array.isArray(r.skills) ? r.skills : [],
      lastAppliedAt: new Date(r.lastAppliedAt),
    }));
  }

  // F-MATCH-01
  async list(jobId: string): Promise<JobMatchesView> {
    const job = await this.dataSource.getRepository(Job).findOneBy({ id: jobId });
    if (!job) throw new NotFoundException('Job not found');
    const matches = await this.dataSource
      .getRepository(JobMatch)
      .createQueryBuilder('m')
      .innerJoin('m.candidate', 'candidate')
      .addSelect(['candidate.id', 'candidate.fullName', 'candidate.email'])
      .where('m.jobId = :jobId', { jobId })
      .orderBy('m.score', 'DESC')
      .addOrderBy('m.lastAppliedAt', 'DESC')
      .addOrderBy('m.candidateId')
      .getMany();
    const pending = job.status !== JobStatus.Draft && job.matchedJdVersion !== job.jdVersion;
    if (pending) await this.enqueue(job.id, job.jdVersion);
    return {
      job: { id: job.id, title: job.title, status: job.status, jdVersion: job.jdVersion },
      computedAt: job.matchedAt,
      computedJdVersion: job.matchedJdVersion,
      pending,
      items: matches.map((m) => ({
        candidate: {
          id: m.candidate!.id,
          fullName: m.candidate!.fullName,
          email: m.candidate!.email,
        },
        score: m.score,
        flags: m.flags,
        reasons: m.scoreBreakdown,
        lastAppliedAt: m.lastAppliedAt,
        invitedAt: m.invitedAt,
        applicationId: m.applicationId,
      })),
    };
  }

  // F-MATCH-02, BR-MATCH-03
  async invite(
    jobId: string,
    candidateId: string,
    user: ScopeUser,
    requestId?: string,
  ): Promise<ApplicationDetailView> {
    const applicationId = await this.dataSource.transaction(async (manager) => {
      const job = await manager.findOne(Job, {
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== JobStatus.Open) {
        throw new BusinessException(ErrorCode.JobNotOpen, 'Job is not open', HttpStatus.CONFLICT);
      }
      const match = await manager.findOne(JobMatch, {
        where: { jobId, candidateId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!match) throw new NotFoundException('Match not found');
      if (match.invitedAt) {
        throw new BusinessException(
          ErrorCode.ApplicationDuplicated,
          'Candidate already invited to this job',
          HttpStatus.CONFLICT,
        );
      }
      const candidate = await manager.findOneBy(Candidate, { id: candidateId });
      if (!candidate || candidate.anonymizedAt || !match.cvFileId) {
        throw new BusinessException(
          ErrorCode.CandidateAnonymized,
          'Candidate data is no longer available',
          HttpStatus.CONFLICT,
        );
      }
      const id = await this.applications.createInvited(manager, {
        jobId,
        candidateId,
        cvFileId: match.cvFileId,
        by: user.id,
      });
      await manager.update(JobMatch, match.id, {
        invitedAt: new Date(),
        invitedBy: user.id,
        applicationId: id,
      });
      return id;
    });
    // Kickoff 12: cv.uploaded
    await this.pipeline.enqueueApplication(applicationId, requestId);
    return this.applications.findOne(applicationId, user);
  }
}
