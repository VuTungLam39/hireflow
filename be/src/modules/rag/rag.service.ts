import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { AuthUser } from '../../common/interfaces/jwt-payload.interface.js';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
  LLM_PROVIDER,
  type LlmProvider,
} from '../ai/ai.types.js';
import { CvPipelineService } from '../ai/pipeline/cv-pipeline.service.js';
import { CvFile, CvParseStatus } from '../files/entities/cv-file.entity.js';
import { CitationRewriter, labelOf } from './citations.js';
import { chunkCv, type CvSection } from './cv-chunks.js';
import { CV_CHUNK_DIMENSION, CvChunk } from './entities/cv-chunk.entity.js';
import { CHAT_SYSTEM, chatPrompt, NOT_ENOUGH_INFO } from './prompts/chat.prompt.js';

type ScopeUser = Pick<AuthUser, 'role' | 'departmentId'>;

// API Contract 4.8
export interface ChatSource {
  candidateId: string;
  chunkId: string;
  candidateName: string;
  applicationId: string;
  excerpt: string;
}

export interface ChatPlan {
  question: string;
  sources: ChatSource[];
  context: { label: string; candidateName: string; section: CvSection; content: string }[];
}

interface RetrievedRow {
  chunkId: string;
  candidateId: string;
  candidateName: string;
  applicationId: string;
  section: CvSection;
  content: string;
}

// Database Design Q8
export const CHAT_TOP_K = 8;
const EXCERPT_CHARS = 300;
const BACKFILL_LIMIT = 500;
const FK_VIOLATION = '23503';

const toVector = (values: number[]) => `[${values.join(',')}]`;

@Injectable()
export class RagService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(EMBEDDING_PROVIDER) private readonly embedding: EmbeddingProvider,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly pipeline: CvPipelineService,
    private readonly config: ConfigService,
  ) {}

  get embeddingModel(): string {
    return `${this.embedding.name}/${this.embedding.model}`.slice(0, 100);
  }

  // Kickoff 8.1
  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('app.env') === 'test') return;
    try {
      const rows = await this.dataSource.query<{ id: string }[]>(
        `SELECT cf.id FROM cv_files cf
         WHERE cf.deleted_at IS NULL AND cf.parse_status = $1 AND cf.text IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM cv_chunks ch WHERE ch.cv_file_id = cf.id AND ch.embedding_model = $2)
         LIMIT ${BACKFILL_LIMIT}`,
        [CvParseStatus.Parsed, this.embeddingModel],
      );
      for (const { id } of rows) await this.pipeline.enqueueEmbed(id);
      if (rows.length) this.logger.log(`Queued embedding for ${rows.length} CV files`);
    } catch (error) {
      this.logger.error(`Embedding backfill skipped: ${(error as Error).message}`);
    }
  }

  // Kickoff 8.1, 8.5: embed-cv
  async embedCv(cvFileId: string): Promise<number> {
    if (this.embedding.dimension !== CV_CHUNK_DIMENSION) {
      throw new Error(
        `EMBEDDING_DIM=${this.embedding.dimension} does not match cv_chunks vector(${CV_CHUNK_DIMENSION})`,
      );
    }
    const cv = await this.dataSource
      .getRepository(CvFile)
      .findOne({ select: ['id', 'text'], where: { id: cvFileId } });
    if (!cv?.text) return 0;
    const chunks = chunkCv(cv.text);
    if (!chunks.length) return 0;

    const vectors = await this.embedding.embed(
      chunks.map((c) => c.content),
      'document',
    );
    if (vectors.length !== chunks.length) throw new Error('Embedding count mismatch');

    const model = this.embeddingModel;
    const params: unknown[] = [];
    const values = chunks.map((c, i) => {
      params.push(
        cvFileId,
        c.section,
        c.position,
        c.content,
        c.tokenCount,
        model,
        toVector(vectors[i]),
      );
      const n = params.length;
      return `($${n - 6}, $${n - 5}, $${n - 4}, $${n - 3}, $${n - 2}, $${n - 1}, $${n}::vector)`;
    });
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(CvChunk, { cvFileId });
        await manager.query(
          `INSERT INTO cv_chunks (cv_file_id, section, position, content, token_count, embedding_model, embedding) VALUES ${values.join(', ')}`,
          params,
        );
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === FK_VIOLATION
      ) {
        return 0;
      }
      throw error;
    }
    return chunks.length;
  }

  // US-08, BR-AI-10, BR-ACC-07
  async prepare(question: string, user: ScopeUser): Promise<ChatPlan> {
    const empty: ChatPlan = { question, sources: [], context: [] };
    if (user.role === Role.HiringManager && !user.departmentId) return empty;

    let vector: number[];
    try {
      [vector] = await this.embedding.embed([question], 'query');
    } catch (error) {
      this.logger.warn(`Query embedding failed: ${(error as Error).message}`);
      throw new BusinessException(
        ErrorCode.AiUnavailable,
        'Embedding provider is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const rows = await this.retrieve(vector, user);
    return {
      question,
      sources: rows.map((r) => ({
        candidateId: r.candidateId,
        chunkId: r.chunkId,
        candidateName: r.candidateName,
        applicationId: r.applicationId,
        excerpt: r.content.slice(0, EXCERPT_CHARS),
      })),
      context: rows.map((r, i) => ({
        label: labelOf(i),
        candidateName: r.candidateName,
        section: r.section,
        content: r.content,
      })),
    };
  }

  // Kickoff 8.5, BR-ACC-07
  private retrieve(vector: number[], user: ScopeUser): Promise<RetrievedRow[]> {
    const params: unknown[] = [toVector(vector), this.embeddingModel, CHAT_TOP_K];
    let scope = '';
    if (user.role === Role.HiringManager) {
      params.push(user.departmentId);
      scope = `AND j.department_id = $${params.length}`;
    }
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SET LOCAL hnsw.iterative_scan = relaxed_order`);
      return manager.query<RetrievedRow[]>(
        `SELECT ch.id AS "chunkId", cf.candidate_id AS "candidateId", c.full_name AS "candidateName",
                app.id AS "applicationId", ch.section, ch.content
         FROM cv_chunks ch
         JOIN cv_files cf ON cf.id = ch.cv_file_id AND cf.deleted_at IS NULL
         JOIN candidates c ON c.id = cf.candidate_id AND c.deleted_at IS NULL AND c.anonymized_at IS NULL
         CROSS JOIN LATERAL (
           SELECT a.id FROM applications a
           JOIN jobs j ON j.id = a.job_id AND j.deleted_at IS NULL
           WHERE a.cv_file_id = ch.cv_file_id AND a.deleted_at IS NULL ${scope}
           ORDER BY a.created_at DESC
           LIMIT 1
         ) app
         WHERE ch.embedding_model = $2
         ORDER BY ch.embedding <=> $1::vector
         LIMIT $3`,
        params,
      );
    });
  }

  // API Contract 4.8
  async *answer(plan: ChatPlan, signal: AbortSignal): AsyncIterable<string> {
    if (!plan.context.length) {
      yield NOT_ENOUGH_INFO;
      return;
    }
    const rewriter = new CitationRewriter(
      new Map(plan.sources.map((s, i) => [labelOf(i), `${s.candidateId}#${s.chunkId}`])),
    );
    for await (const token of this.llm.streamText({
      task: 'chat',
      system: CHAT_SYSTEM,
      messages: [{ role: 'user', content: chatPrompt(plan.question, plan.context) }],
      maxOutputTokens: 1024,
      signal,
    })) {
      if (signal.aborted) return;
      const text = rewriter.push(token);
      if (text) yield text;
    }
    const rest = rewriter.flush();
    if (rest) yield rest;
  }
}
