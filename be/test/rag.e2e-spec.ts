import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import {
  EMBEDDING_PROVIDER,
  LLM_PROVIDER,
  type EmbeddingInput,
  type StreamRequest,
} from '../src/modules/ai/ai.types.js';
import { FakeEmbeddingProvider } from '../src/modules/ai/providers/fake.embedding.js';
import { FakeLlmProvider } from '../src/modules/ai/providers/fake.llm.js';
import { makeDocx } from '../src/modules/ai/testing/cv-fixtures.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { StorageService } from '../src/modules/files/storage/storage.service.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { NOT_ENOUGH_INFO } from '../src/modules/rag/prompts/chat.prompt.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const EMBED_DOWN = 'EMBED_DOWN_MARKER';
const LLM_DOWN = 'LLM_DOWN_MARKER';

interface Source {
  candidateId: string;
  chunkId: string;
  candidateName: string;
  applicationId: string;
  excerpt: string;
}

interface ChatResult {
  status: number;
  events: { event: string; data: unknown }[];
  sources: Source[];
  text: string;
}

class FlakyEmbedding extends FakeEmbeddingProvider {
  embed(texts: string[], input: EmbeddingInput) {
    if (texts.some((t) => t.includes(EMBED_DOWN))) {
      return Promise.reject(new Error('embedding down'));
    }
    return super.embed(texts, input);
  }
}

const cvOf = (name: string, lines: string[]) => [
  name,
  'Email: hidden@example.com | Điện thoại: 0912 345 678',
  'KINH NGHIỆM LÀM VIỆC',
  ...lines,
  'KỸ NĂNG',
  'NestJS, PostgreSQL, Docker',
  'HỌC VẤN',
  'Kỹ sư Công nghệ thông tin – Đại học Bách khoa Hà Nội (tốt nghiệp 2021)',
];

// US-08 · BR-AI-10 · BR-ACC-07 · API Contract 4.8 · Kickoff 8.1, 8.5
describe('RAG chat (e2e, LLM và embedding giả)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const tokens: Record<'admin' | 'hr' | 'hmA' | 'hmC', string> = {
    admin: '',
    hr: '',
    hmA: '',
    hmC: '',
  };
  const ids = { depA: '', depB: '', depC: '', jobA: '', jobB: '' };
  const apps = { a1: '', b1: '', broken: '' };

  const llm = new FakeLlmProvider({}, (req: StreamRequest) => {
    const prompt = req.messages.map((m) => m.content).join('\n');
    if (prompt.includes(LLM_DOWN)) throw new Error('llm down');
    const labels = [...new Set(prompt.match(/\[S\d+\]/g) ?? [])];
    return `Ứng viên phù hợp: ${labels.join(' ')} [S99] [S1, S2].`;
  });
  const streamCalls = () => llm.calls.filter((c) => 'messages' in c).length;

  const server = () => app.getHttpServer();
  const as = (who: keyof typeof tokens, req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens[who]}`);

  const chat = async (who: keyof typeof tokens, question: string): Promise<ChatResult> => {
    const res = await as(who, request(server()).post('/api/v1/ai/chat'))
      .send({ question })
      .buffer(true)
      .parse((r, cb) => {
        let body = '';
        r.setEncoding('utf8');
        r.on('data', (chunk: string) => (body += chunk));
        r.on('end', () => cb(null, body));
      });
    const events = String(res.body)
      .split('\n\n')
      .filter((b) => b.trim())
      .map((block) => {
        const event = /^event: (.+)$/m.exec(block)?.[1] ?? 'message';
        const data = JSON.parse(/^data: (.+)$/m.exec(block)?.[1] ?? 'null') as unknown;
        return { event, data };
      });
    return {
      status: res.status,
      events,
      sources: (events.find((e) => e.event === 'sources')?.data ?? []) as Source[],
      text: events
        .filter((e) => e.event === 'token')
        .map((e) => (e.data as { text: string }).text)
        .join(''),
    };
  };

  const upload = async (jobId: string, email: string, lines: string[]) => {
    const res = await as('hr', request(server()).post(`/api/v1/jobs/${jobId}/applications`))
      .field('fullName', `RAG ${run} ${email.split('@')[0]}`)
      .field('email', email)
      .field('consentConfirmed', 'true')
      .attach('cv', await makeDocx(lines), { filename: 'cv.docx', contentType: DOCX })
      .expect(201);
    return res.body.data as { id: string; cv: { fileId: string } };
  };

  const waitUntil = async (check: () => Promise<boolean>, what: string, timeoutMs = 20_000) => {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      if (await check()) return;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Timed out waiting for ${what}`);
  };
  const chunksOf = (applicationId: string) =>
    ds.query<{ id: string; content: string; section: string }[]>(
      `SELECT ch.id, ch.content, ch.section FROM cv_chunks ch
       JOIN applications a ON a.cv_file_id = ch.cv_file_id WHERE a.id = $1 ORDER BY ch.position`,
      [applicationId],
    );
  const aiStatusOf = async (applicationId: string) =>
    (await ds.getRepository(Application).findOneByOrFail({ id: applicationId })).aiStatus;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PROVIDER)
      .useValue(llm)
      .overrideProvider(EMBEDDING_PROVIDER)
      .useValue(new FlakyEmbedding(1024))
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB, depC] = await ds.getRepository(Department).save(
      ['A', 'B', 'C'].map((k) => ({
        name: `RAG ${k} ${run}`,
        code: `RAG${k}_${run}`.toUpperCase(),
      })),
    );
    Object.assign(ids, { depA: depA.id, depB: depB.id, depC: depC.id });
    const passwordHash = await bcrypt.hash('Password123', 4);
    const users = await ds.getRepository(User).save([
      {
        email: `rag-admin-${run}@example.com`,
        fullName: 'RAG Admin',
        role: Role.Admin,
        passwordHash,
      },
      { email: `rag-hr-${run}@example.com`, fullName: 'RAG HR', role: Role.Hr, passwordHash },
      {
        email: `rag-hma-${run}@example.com`,
        fullName: 'RAG HM A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      {
        email: `rag-hmc-${run}@example.com`,
        fullName: 'RAG HM C',
        role: Role.HiringManager,
        departmentId: depC.id,
        passwordHash,
      },
    ]);
    const jobOf = (title: string, departmentId: string) => ({
      title,
      departmentId,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'Tuyển Backend Developer biết NestJS và PostgreSQL.',
      jdVersion: 1,
      createdBy: users[1].id,
      publishedAt: new Date(),
    });
    const [jobA, jobB] = await ds
      .getRepository(Job)
      .save([jobOf(`RAG A ${run}`, depA.id), jobOf(`RAG B ${run}`, depB.id)]);
    Object.assign(ids, { jobA: jobA.id, jobB: jobB.id });
    await ds.getRepository(JobRequirement).save(
      [jobA, jobB].map((job) => ({
        jobId: job.id,
        jdVersion: 1,
        position: 1,
        label: 'NestJS',
        type: RequirementType.Must,
        weight: 3,
        minYears: null,
        keywords: ['nestjs'],
      })),
    );

    const keys = ['admin', 'hr', 'hmA', 'hmC'] as const;
    for (const [i, key] of keys.entries()) {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: users[i].email, password: 'Password123' })
        .expect(200);
      tokens[key] = login.body.data.tokens.accessToken;
    }

    apps.a1 = (
      await upload(
        jobA.id,
        `a1-${run}@example.com`,
        cvOf('Lê Văn An', [
          `Xây dựng hệ thống xử lý sự kiện bằng Kafka cho ví điện tử fintech ${run}.`,
        ]),
      )
    ).id;
    apps.b1 = (
      await upload(
        jobB.id,
        `b1-${run}@example.com`,
        cvOf('Phạm Thị Bích', [`Vận hành cụm Kafka cho sàn thương mại điện tử ${run}.`]),
      )
    ).id;
    apps.broken = (
      await upload(
        jobA.id,
        `broken-${run}@example.com`,
        cvOf('Trần Minh Cường', [`3 năm phát triển REST API bằng NestJS ${EMBED_DOWN}.`]),
      )
    ).id;

    await waitUntil(
      async () =>
        (await chunksOf(apps.a1)).length > 0 &&
        (await chunksOf(apps.b1)).length > 0 &&
        (await aiStatusOf(apps.broken)) === AiStatus.Done,
      'chunks and scores',
    );
  }, 60_000);

  afterAll(async () => {
    const appRows = await ds.getRepository(Application).find({
      where: { jobId: In([ids.jobA, ids.jobB]) },
      withDeleted: true,
    });
    const candidateIds = [...new Set(appRows.map((a) => a.candidateId))];
    const files = await ds.getRepository(CvFile).findBy({ candidateId: In(candidateIds) });
    const storage = app.get(StorageService);
    await app.close();
    if (!ds.isInitialized) await ds.initialize();
    await Promise.all(files.map((f) => storage.remove(f.storageKey)));
    await ds
      .getRepository(ApplicationStatusHistory)
      .delete({ applicationId: In(appRows.map((a) => a.id)) });
    await ds.getRepository(Application).delete({ id: In(appRows.map((a) => a.id)) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(JobRequirement).delete({ jobId: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(Job).delete({ id: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(User).delete({
      email: In(Object.keys(tokens).map((k) => `rag-${k.toLowerCase()}-${run}@example.com`)),
    });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB, ids.depC]) });
    await ds.destroy();
  }, 30_000);

  it('Kickoff 8.5: chunks a CV by section with email and phone masked', async () => {
    const chunks = await chunksOf(apps.a1);
    expect(chunks.map((c) => c.section)).toEqual(['summary', 'experience', 'skills', 'education']);
    const all = chunks.map((c) => c.content).join('\n');
    expect(all).not.toContain('hidden@example.com');
    expect(all).not.toContain('0912 345 678');
  });

  it('Kickoff 8.1: an embedding failure does not block scoring', async () => {
    const scored = await ds.getRepository(Application).findOneByOrFail({ id: apps.broken });
    expect(scored.aiStatus).toBe(AiStatus.Done);
    expect(scored.score).not.toBeNull();
    expect(await chunksOf(apps.broken)).toEqual([]);
  });

  it('API Contract 4.8: streams sources first, then tokens, then done', async () => {
    const [, experience] = await chunksOf(apps.a1);
    const res = await chat('hr', experience.content);
    expect(res.status).toBe(200);
    expect(res.events[0].event).toBe('sources');
    expect(res.events.at(-1)?.event).toBe('done');
    expect(res.events.slice(1, -1).every((e) => e.event === 'token')).toBe(true);
    expect(res.sources[0]).toMatchObject({
      chunkId: experience.id,
      applicationId: apps.a1,
      candidateName: `RAG ${run} a1-${run}`,
    });
    expect(res.sources[0].excerpt).toBe(experience.content.slice(0, 300));
  });

  it('BR-AI-10: every citation in the answer is in sources; unknown labels are dropped', async () => {
    const [, experience] = await chunksOf(apps.a1);
    const res = await chat('hr', experience.content);
    const keys = new Set(res.sources.map((s) => `${s.candidateId}#${s.chunkId}`));
    const cited = [...res.text.matchAll(/\[([0-9a-f-]{36}#[0-9a-f-]{36})\]/g)].map((m) => m[1]);
    expect(cited.length).toBeGreaterThanOrEqual(res.sources.length);
    expect(cited.every((c) => keys.has(c))).toBe(true);
    expect(res.text).not.toMatch(/\[S\d+/);
  });

  it('BR-ACC-07: Hiring Manager never receives CV chunks of another department', async () => {
    const [, otherDept] = await chunksOf(apps.b1);
    const res = await chat('hmA', otherDept.content);
    expect(res.status).toBe(200);
    expect(res.sources.map((s) => s.chunkId)).not.toContain(otherDept.id);
    expect(res.sources.every((s) => s.applicationId !== apps.b1)).toBe(true);
    const deptOf = await ds.query<{ id: string }[]>(
      `SELECT a.id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ANY($1) AND j.department_id <> $2`,
      [res.sources.map((s) => s.applicationId), ids.depA],
    );
    expect(deptOf).toEqual([]);
  });

  it('HR sees chunks from every department', async () => {
    const [, otherDept] = await chunksOf(apps.b1);
    const res = await chat('hr', otherDept.content);
    expect(res.sources[0]).toMatchObject({ chunkId: otherDept.id, applicationId: apps.b1 });
  });

  it('BR-AI-10: answers "không đủ thông tin" with empty sources when nothing is in scope, without calling the LLM', async () => {
    const before = streamCalls();
    const res = await chat('hmC', 'Ai biết Kafka?');
    expect(res.status).toBe(200);
    expect(res.sources).toEqual([]);
    expect(res.text).toBe(NOT_ENOUGH_INFO);
    expect(res.events.at(-1)?.event).toBe('done');
    expect(streamCalls()).toBe(before);
  });

  it('API Contract 4.8: an LLM failure mid-stream ends with an error event', async () => {
    const res = await chat('hr', `Ai biết Kafka? ${LLM_DOWN}`);
    expect(res.status).toBe(200);
    expect(res.events[0].event).toBe('sources');
    expect(res.events.at(-1)).toEqual({
      event: 'error',
      data: { code: 'AI_UNAVAILABLE', message: 'AI is unavailable' },
    });
  });

  it('validates the question and requires a token, answering JSON before the stream opens', async () => {
    const bad = await as('hr', request(server()).post('/api/v1/ai/chat'))
      .send({ question: '   ' })
      .expect(400);
    expect(bad.body.code).toBe('VALIDATION_FAILED');
    const long = await as('hr', request(server()).post('/api/v1/ai/chat'))
      .send({ question: 'x'.repeat(501) })
      .expect(400);
    expect(long.body.code).toBe('VALIDATION_FAILED');
    const anon = await request(server())
      .post('/api/v1/ai/chat')
      .send({ question: 'Ai biết Kafka?' })
      .expect(401);
    expect(anon.body.code).toBe('UNAUTHORIZED');
  });

  it('BR-DATA-03: anonymizing a candidate removes their CV chunks from search', async () => {
    const [, experience] = await chunksOf(apps.b1);
    const candidateId = (await ds.getRepository(Application).findOneByOrFail({ id: apps.b1 }))
      .candidateId;
    await as('admin', request(server()).post(`/api/v1/candidates/${candidateId}/anonymize`)).expect(
      200,
    );
    expect(await chunksOf(apps.b1)).toEqual([]);
    const res = await chat('hr', experience.content);
    expect(res.sources.map((s) => s.chunkId)).not.toContain(experience.id);
  });
});
