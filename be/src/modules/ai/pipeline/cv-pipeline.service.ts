import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Queue, type JobsOptions } from 'bullmq';
import { DataSource, In, IsNull, Not } from 'typeorm';
import { aiConfig } from '../../../config/ai.config.js';
import { queueConfig } from '../../../config/queue.config.js';
import { AiStatus } from '../../../common/enums/ai-status.enum.js';
import { BusinessException, ErrorCode } from '../../../common/exceptions/index.js';
import { Application } from '../../applications/entities/application.entity.js';
import { CvFile, CvParseStatus } from '../../files/entities/cv-file.entity.js';
import { StorageNotFoundError, StorageService } from '../../files/storage/storage.service.js';
import { Job } from '../../jobs/entities/job.entity.js';
import { JobRequirement } from '../../jobs/entities/job-requirement.entity.js';
import { LLM_PROVIDER, LlmError, type LlmProvider } from '../ai.types.js';
import { CvParseError, extractCvText } from '../cv-parser.js';
import { maskPii } from '../cv-text.js';
import { extractProfile } from '../cv-extract.js';
import { CvProfile } from '../entities/cv-profile.entity.js';
import { scoreApplication } from '../scoring.js';
import { type CvJobData, jobId, QUEUE, type RescoreJobData, type ScoreJobData } from './queues.js';
import { AI_ERROR, PipelineFailure } from './errors.js';

export { AI_ERROR, PipelineFailure } from './errors.js';

const PARSE_ERROR: Record<CvParseError['reason'], string> = {
  NO_TEXT: AI_ERROR.noText,
  UNREADABLE: AI_ERROR.unreadable,
  UNSUPPORTED: AI_ERROR.unreadable,
  TOO_LARGE: AI_ERROR.tooLarge,
};

const ACTIVE = In([AiStatus.Pending, AiStatus.Processing]);

@Injectable()
export class CvPipelineService implements OnModuleInit {
  private readonly logger = new Logger(CvPipelineService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    @Inject(aiConfig.KEY) private readonly ai: ConfigType<typeof aiConfig>,
    @Inject(queueConfig.KEY) private readonly queues: ConfigType<typeof queueConfig>,
    @InjectQueue(QUEUE.parse) private readonly parseQueue: Queue<CvJobData>,
    @InjectQueue(QUEUE.extract) private readonly extractQueue: Queue<CvJobData>,
    @InjectQueue(QUEUE.score) private readonly scoreQueue: Queue<ScoreJobData | RescoreJobData>,
    @InjectQueue(QUEUE.embed) private readonly embedQueue: Queue<CvJobData>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.extractQueue.setGlobalRateLimit(this.queues.llmPerMinute, 60_000);
    } catch (error) {
      this.logger.error(`Cannot set LLM rate limit: ${(error as Error).message}`);
    }
  }

  // ---------- đưa việc vào queue (gọi sau khi transaction commit) ----------

  // Kickoff 12: cv.uploaded
  async enqueueApplication(applicationId: string, requestId?: string): Promise<void> {
    const app = await this.applications().findOneBy({ id: applicationId });
    if (!app?.cvFileId) return;
    await this.safely(`application ${applicationId}`, () =>
      this.enqueueParse(app.cvFileId!, requestId),
    );
  }

  // BR-AI-08
  async rescore(applicationId: string, requestId?: string): Promise<void> {
    const app = await this.applications().findOne({
      where: { id: applicationId },
      relations: { job: true },
    });
    if (!app?.cvFileId) {
      throw new BusinessException(
        ErrorCode.AiUnavailable,
        'Application has no CV to score',
        HttpStatus.CONFLICT,
      );
    }
    const ready = app.aiStatus === AiStatus.Done && (await this.findProfile(app.cvFileId)) !== null;
    await this.applications().update(applicationId, {
      aiStatus: AiStatus.Processing,
      aiError: null,
    });
    try {
      if (ready) {
        await this.add(
          this.scoreQueue,
          'score',
          { applicationId, requestId },
          { jobId: jobId.score(applicationId, app.job!.jdVersion) },
        );
      } else {
        await this.enqueueParse(app.cvFileId, requestId);
      }
    } catch (error) {
      await this.applications().update(applicationId, {
        aiStatus: app.aiStatus,
        aiError: app.aiError,
      });
      this.logger.error(`rescore ${applicationId}: cannot enqueue: ${(error as Error).message}`);
      throw new BusinessException(
        ErrorCode.AiUnavailable,
        'AI queue is unavailable, please try again',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // Kickoff 12: job.requirements.updated, BR-AI-05
  async enqueueJobRescore(id: string, jdVersion: number, requestId?: string): Promise<void> {
    await this.safely(`job ${id} v${jdVersion}`, () =>
      this.add(
        this.scoreQueue,
        'rescore-job',
        { jobId: id, jdVersion, requestId },
        { jobId: jobId.rescoreJob(id, jdVersion) },
      ),
    );
  }

  // Kickoff 12: commit xong mà queue lỗi thì để PENDING, Admin chạy lại
  private async safely(what: string, enqueue: () => Promise<void>): Promise<void> {
    try {
      await enqueue();
    } catch (error) {
      this.logger.error(`Cannot enqueue ${what}: ${(error as Error).message}`);
    }
  }

  private enqueueParse(cvFileId: string, requestId?: string) {
    return this.add(
      this.parseQueue,
      'parse',
      { cvFileId, requestId },
      { jobId: jobId.parse(cvFileId) },
    );
  }

  // Job lỗi cũ cùng jobId chặn việc thêm lại, nên xoá trước
  private async add<T>(queue: Queue<T>, name: string, data: T, opts: JobsOptions): Promise<void> {
    const existing = opts.jobId ? await queue.getJob(opts.jobId) : undefined;
    if (existing && (await existing.isFailed())) await existing.remove();
    await (queue as Queue).add(name, data, opts);
  }

  // ---------- các bước của worker ----------

  // Kickoff 8.1: parse-cv
  async parse({ cvFileId, requestId }: CvJobData): Promise<void> {
    const cv = await this.dataSource.getRepository(CvFile).findOneBy({ id: cvFileId });
    if (!cv) return;
    await this.applications().update(
      { cvFileId, aiStatus: AiStatus.Pending },
      { aiStatus: AiStatus.Processing },
    );

    if (cv.parseStatus !== CvParseStatus.Parsed || !cv.text) {
      try {
        const text = await extractCvText(await this.storage.get(cv.storageKey), cv.mime);
        await this.dataSource
          .getRepository(CvFile)
          .update(cvFileId, { parseStatus: CvParseStatus.Parsed, text, parseError: null });
      } catch (error) {
        const reason =
          error instanceof CvParseError
            ? PARSE_ERROR[error.reason]
            : error instanceof StorageNotFoundError
              ? AI_ERROR.fileMissing
              : null;
        if (!reason) throw error;
        await this.dataSource
          .getRepository(CvFile)
          .update(cvFileId, { parseStatus: CvParseStatus.Failed, parseError: reason });
        throw new PipelineFailure(reason);
      }
    }

    await this.add(
      this.extractQueue,
      'extract',
      { cvFileId, requestId },
      { jobId: jobId.extract(cvFileId, this.ai.promptVersion) },
    );
    // Kickoff 8.1: embed-cv
    await this.safely(`embed ${cvFileId}`, () => this.enqueueEmbed(cvFileId, requestId));
  }

  enqueueEmbed(cvFileId: string, requestId?: string): Promise<void> {
    return this.add(
      this.embedQueue,
      'embed',
      { cvFileId, requestId },
      { jobId: jobId.embed(cvFileId) },
    );
  }

  // Kickoff 8.1: extract-cv, BR-AI-06
  async extract({ cvFileId, requestId }: CvJobData): Promise<void> {
    const cv = await this.dataSource.getRepository(CvFile).findOneBy({ id: cvFileId });
    if (!cv?.text) return;

    if (!(await this.findProfile(cvFileId))) {
      const { data, model, inputTokens, outputTokens } = await this.callExtract(cv.text);
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(CvProfile)
        .values({
          cvFileId,
          data,
          model,
          promptVersion: this.ai.promptVersion,
          inputTokens,
          outputTokens,
          costUsd: 0,
        })
        .orIgnore()
        .execute();
    }

    const waiting = await this.applications().find({
      where: { cvFileId, aiStatus: ACTIVE },
      relations: { job: true },
    });
    for (const app of waiting) {
      await this.add(
        this.scoreQueue,
        'score',
        { applicationId: app.id, requestId },
        { jobId: jobId.score(app.id, app.job!.jdVersion) },
      );
    }
  }

  private callExtract(text: string) {
    return extractProfile(this.llm, text, (attempt, error) =>
      this.logger.warn(`extract-cv invalid output (attempt ${attempt}): ${error.message}`),
    );
  }

  // Kickoff 8.4: score
  async score({ applicationId, requestId }: ScoreJobData): Promise<void> {
    const app = await this.applications().findOne({
      where: { id: applicationId },
      relations: { job: true, cvFile: true },
    });
    if (!app?.cvFile?.text) return;
    const profile = await this.findProfile(app.cvFileId!);
    if (!profile) {
      await this.enqueueParse(app.cvFileId!, requestId);
      return;
    }
    const requirements = await this.requirementsOf(app.jobId, app.job!.jdVersion);
    await this.saveScore(app.id, app.job!.jdVersion, requirements, profile, app.cvFile.text);
  }

  // BR-AI-05: tính lại bằng code, không gọi LLM
  async rescoreJob({ jobId: id, jdVersion }: RescoreJobData): Promise<number> {
    const job = await this.dataSource.getRepository(Job).findOneBy({ id });
    if (!job || job.jdVersion !== jdVersion) return 0;
    const requirements = await this.requirementsOf(id, jdVersion);
    const apps = await this.applications().find({
      where: { jobId: id, aiStatus: AiStatus.Done, cvFileId: Not(IsNull()) },
      relations: { cvFile: true },
    });
    const profiles = await this.dataSource.getRepository(CvProfile).findBy({
      cvFileId: In([...new Set(apps.map((a) => a.cvFileId!))]),
      promptVersion: this.ai.promptVersion,
    });
    const byFile = new Map(profiles.map((p) => [p.cvFileId, p]));
    let count = 0;
    for (const app of apps) {
      const profile = byFile.get(app.cvFileId!);
      if (!profile || !app.cvFile?.text) continue;
      await this.saveScore(app.id, jdVersion, requirements, profile, app.cvFile.text);
      count++;
    }
    return count;
  }

  private async saveScore(
    applicationId: string,
    jdVersion: number,
    requirements: JobRequirement[],
    profile: CvProfile,
    cvText: string,
  ) {
    const result = scoreApplication(requirements, profile.data.skills, maskPii(cvText));
    await this.applications().update(applicationId, {
      score: result.score,
      scoreBreakdown: result.breakdown,
      flags: result.flags,
      scoredJdVersion: jdVersion,
      scoredAt: new Date(),
      aiStatus: AiStatus.Done,
      aiError: null,
    });
  }

  // ---------- thất bại sau khi hết lượt retry ----------

  // BR-AI-07
  async failCv(cvFileId: string, error: Error): Promise<void> {
    await this.applications().update(
      { cvFileId, aiStatus: ACTIVE },
      { aiStatus: AiStatus.Failed, aiError: this.reasonOf(error) },
    );
  }

  async failApplication(applicationId: string, error: Error): Promise<void> {
    await this.applications().update(
      { id: applicationId, aiStatus: ACTIVE },
      { aiStatus: AiStatus.Failed, aiError: this.reasonOf(error) },
    );
  }

  private reasonOf(error: Error): string {
    if (error instanceof PipelineFailure) return error.reason;
    if (error instanceof LlmError) return AI_ERROR.unavailable;
    return `${AI_ERROR.unavailable} (${error.message.slice(0, 200)})`;
  }

  // ---------- truy vấn ----------

  private applications() {
    return this.dataSource.getRepository(Application);
  }

  private findProfile(cvFileId: string) {
    return this.dataSource
      .getRepository(CvProfile)
      .findOneBy({ cvFileId, promptVersion: this.ai.promptVersion });
  }

  private requirementsOf(id: string, jdVersion: number) {
    return this.dataSource
      .getRepository(JobRequirement)
      .find({ where: { jobId: id, jdVersion }, order: { position: 'ASC' } });
  }
}
