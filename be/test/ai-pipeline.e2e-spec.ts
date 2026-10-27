import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ScoreFlag } from '../src/common/enums/score-flag.enum.js';
import { LLM_PROVIDER, LlmError, type JsonRequest } from '../src/modules/ai/ai.types.js';
import { CvProfile } from '../src/modules/ai/entities/cv-profile.entity.js';
import { AI_ERROR } from '../src/modules/ai/pipeline/cv-pipeline.service.js';
import { fakeExtract, fakeSuggest, FakeLlmProvider } from '../src/modules/ai/providers/fake.llm.js';
import { makeDocx, makePdf, SAMPLE_CV } from '../src/modules/ai/testing/cv-fixtures.js';
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
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const INVALID_MARKER = 'CV_GAY_LOI_SCHEMA';
const BROKEN_JD = 'JD_LLM_SAP';
const FABRICATE_MARKER = 'CV_GAY_BIA_BANG_CHUNG';
const FABRICATED = '8 năm phát triển giao diện bằng React cho ngân hàng';

interface Detail {
  id: string;
  status: string;
  aiStatus: AiStatus;
  aiError: string | null;
  score: number | null;
  flags: ScoreFlag[];
  scoredJdVersion: number | null;
  breakdown: {
    requirementId: string;
    match: number;
    evidence: string | null;
    rejectedEvidence: string | null;
  }[];
  requirements: { id: string; label: string }[];
  cv: { text: string | null } | null;
}

// Kickoff 8, 12 · BR-AI-02 → 09 · BR-FILE-04 · API Contract 4.4, 4.5
describe('AI pipeline (e2e, LLM giả)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  let token = '';
  const ids = { dep: '', job: '', job2: '' };

  const llm = new FakeLlmProvider({
    'extract-cv': (req: JsonRequest) => {
      if (req.prompt.includes(INVALID_MARKER)) return { skills: 'không phải mảng' };
      const profile = fakeExtract(req) as { skills: unknown[] };
      if (req.prompt.includes(FABRICATE_MARKER)) {
        profile.skills.push({ name: 'React', years: 8, evidence: FABRICATED });
      }
      return profile;
    },
    'suggest-requirements': (req: JsonRequest) => {
      if (req.prompt.includes(BROKEN_JD))
        throw new LlmError('down', 'fake', 'UNAVAILABLE', true, 503);
      return fakeSuggest(req);
    },
  });
  const extractCalls = (marker?: string) =>
    llm.calls.filter(
      (c) => 'prompt' in c && c.task === 'extract-cv' && (!marker || c.prompt.includes(marker)),
    ).length;

  const server = () => app.getHttpServer();
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
  const detail = async (id: string) =>
    (await auth(request(server()).get(`/api/v1/applications/${id}`)).expect(200)).body
      .data as Detail;

  const waitFor = async (id: string, done: (d: Detail) => boolean, timeoutMs = 20_000) => {
    const until = Date.now() + timeoutMs;
    let last: Detail | undefined;
    while (Date.now() < until) {
      last = await detail(id);
      if (done(last)) return last;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Timed out waiting for ${id}: ${JSON.stringify(last)}`);
  };
  const settled = (d: Detail) => d.aiStatus === AiStatus.Done || d.aiStatus === AiStatus.Failed;

  const upload = async (jobId: string, email: string, content: Buffer, type = DOCX) => {
    const res = await auth(request(server()).post(`/api/v1/jobs/${jobId}/applications`))
      .field('fullName', `Ứng viên ${run}`)
      .field('email', email)
      .field('consentConfirmed', 'true')
      .attach('cv', content, { filename: type === DOCX ? 'cv.docx' : 'cv.pdf', contentType: type })
      .expect(201);
    return res.body.data as Detail;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PROVIDER)
      .useValue(llm)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `AI ${run}`, code: `AI_${run}`.toUpperCase() });
    const hr = await ds.getRepository(User).save({
      email: `ai-hr-${run}@example.com`,
      fullName: 'AI HR',
      role: Role.Hr,
      passwordHash: await bcrypt.hash('Password123', 4),
    });
    const jobOf = (title: string, jdText: string) => ({
      title,
      departmentId: dep.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText,
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    const [job, job2] = await ds
      .getRepository(Job)
      .save([
        jobOf(`Backend ${run}`, 'Yêu cầu NestJS, PostgreSQL; ưu tiên Docker và Redis.'),
        jobOf(`Backend 2 ${run}`, 'JD'),
      ]);
    const requirement = (
      jobId: string,
      position: number,
      label: string,
      type: RequirementType,
      weight: number,
      minYears: number | null,
      keywords: string[],
    ) => ({ jobId, jdVersion: 1, position, label, type, weight, minYears, keywords });
    await ds
      .getRepository(JobRequirement)
      .save([
        requirement(job.id, 1, 'NestJS', RequirementType.Must, 3, 2, ['nestjs']),
        requirement(job.id, 2, 'PostgreSQL', RequirementType.Must, 2, null, ['postgresql']),
        requirement(job.id, 3, 'React', RequirementType.Nice, 1, null, ['react']),
        requirement(job2.id, 1, 'Docker', RequirementType.Must, 1, null, ['docker']),
      ]);
    Object.assign(ids, { dep: dep.id, job: job.id, job2: job2.id });

    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: hr.email, password: 'Password123' })
      .expect(200);
    token = login.body.data.tokens.accessToken;
  }, 30_000);

  afterAll(async () => {
    const candidates = await ds
      .getRepository(Candidate)
      .find({ where: { fullName: `Ứng viên ${run}` }, withDeleted: true });
    const candidateIds = candidates.map((c) => c.id);
    const files = await ds.getRepository(CvFile).findBy({ candidateId: In(candidateIds) });
    const apps = await ds.getRepository(Application).find({
      where: { jobId: In([ids.job, ids.job2]) },
      withDeleted: true,
    });
    const storage = app.get(StorageService);
    await app.close();
    if (!ds.isInitialized) await ds.initialize();
    await Promise.all(files.map((f) => storage.remove(f.storageKey)));
    await ds
      .getRepository(ApplicationStatusHistory)
      .delete({ applicationId: In(apps.map((a) => a.id)) });
    await ds.getRepository(Application).delete({ id: In(apps.map((a) => a.id)) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(JobRequirement).delete({ jobId: In([ids.job, ids.job2]) });
    await ds.getRepository(Job).delete({ id: In([ids.job, ids.job2]) });
    await ds.getRepository(User).delete({ email: `ai-hr-${run}@example.com` });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await ds.destroy();
  }, 30_000);

  let first = '';
  const email = `cv-${run}@example.com`;

  it('BR-AI-01, BR-AI-02: parses, extracts and scores an uploaded CV with verbatim evidence, without touching the status', async () => {
    const created = await upload(ids.job, email, await makeDocx(SAMPLE_CV));
    expect(created.aiStatus).toBe(AiStatus.Pending);
    first = created.id;

    const done = await waitFor(first, settled);
    expect(done).toMatchObject({ aiStatus: AiStatus.Done, aiError: null, scoredJdVersion: 1 });
    expect(done.status).toBe('NEW');
    // BR-AI-02: (3 × 1 + 2 × 1 + 1 × 0) / 6
    expect(done.score).toBe(83);
    expect(done.flags).toEqual([]);
    const byLabel = Object.fromEntries(
      done.requirements.map((r) => [r.label, done.breakdown.find((b) => b.requirementId === r.id)]),
    );
    expect(byLabel.NestJS).toMatchObject({ match: 1 });
    expect(byLabel.NestJS!.evidence).toContain('3 năm phát triển REST API bằng NestJS');
    expect(byLabel.React).toMatchObject({ match: 0, evidence: null });
    expect(done.cv?.text).toContain('Đóng gói và triển khai dịch vụ bằng Docker.');
  });

  it('masks email and phone before calling the LLM (BR-AI-09)', () => {
    const prompt = llm.calls.find((c) => 'prompt' in c && c.task === 'extract-cv') as JsonRequest;
    expect(prompt.prompt).toContain('[EMAIL]');
    expect(prompt.prompt).toContain('[PHONE]');
    expect(prompt.prompt).not.toContain('binh.tran@example.com');
    expect(prompt.prompt).not.toContain('0912 345 678');
  });

  it('extracts each CV once per prompt version, even across jobs (BR-AI-06)', async () => {
    const before = extractCalls();
    const second = await upload(ids.job2, email, await makeDocx(SAMPLE_CV));
    const done = await waitFor(second.id, settled);
    expect(done).toMatchObject({ aiStatus: AiStatus.Done, score: 100 });
    expect(extractCalls()).toBe(before);
    const cv = await ds.getRepository(Application).findOneByOrFail({ id: second.id });
    expect(await ds.getRepository(CvProfile).countBy({ cvFileId: cv.cvFileId! })).toBe(1);
  });

  it('rescores the whole job by code when requirements change (BR-AI-05)', async () => {
    const before = extractCalls();
    const saved = await auth(request(server()).put(`/api/v1/jobs/${ids.job}/requirements`))
      .send({
        requirements: [
          { label: 'NestJS', type: 'MUST', weight: 3, minYears: 5, keywords: ['nestjs'] },
          { label: 'React', type: 'MUST', weight: 1, minYears: null, keywords: ['react'] },
        ],
      })
      .expect(202);
    expect(saved.body.data).toEqual({ jdVersion: 2 });

    const done = await waitFor(first, (d) => d.scoredJdVersion === 2);
    // NestJS thiếu năm (0,5 × 3) + React không có (0) trên tổng 4
    expect(done.score).toBe(38);
    expect(done.flags).toEqual([ScoreFlag.MissingMust]);
    expect(extractCalls()).toBe(before);
  });

  it('rescore of a DONE application recalculates without the LLM (BR-AI-08)', async () => {
    const before = extractCalls();
    await auth(request(server()).post(`/api/v1/applications/${first}/rescore`)).expect(202);
    const done = await waitFor(first, settled);
    expect(done).toMatchObject({ aiStatus: AiStatus.Done, score: 38 });
    expect(extractCalls()).toBe(before);
  });

  it('marks a CV without text as FAILED with a reason (BR-FILE-04)', async () => {
    const created = await upload(
      ids.job,
      `scan-${run}@example.com`,
      makePdf([]),
      'application/pdf',
    );
    const failed = await waitFor(created.id, settled);
    expect(failed).toMatchObject({
      aiStatus: AiStatus.Failed,
      aiError: AI_ERROR.noText,
      score: null,
    });

    await auth(request(server()).post(`/api/v1/applications/${created.id}/rescore`)).expect(202);
    expect((await detail(created.id)).aiStatus).not.toBe(AiStatus.Done);
    const again = await waitFor(created.id, settled);
    expect(again).toMatchObject({ aiStatus: AiStatus.Failed, aiError: AI_ERROR.noText });
  });

  it('BR-FILE-04: HR types the text of a scanned CV, the pipeline extracts and scores it once', async () => {
    const created = await upload(
      ids.job,
      `scan-manual-${run}@example.com`,
      makePdf([]),
      'application/pdf',
    );
    await waitFor(created.id, settled);
    const before = extractCalls();
    const text = SAMPLE_CV.join('\n');

    const res = await auth(
      request(server()).put(`/api/v1/applications/${created.id}/cv-text`).send({ text }),
    ).expect(200);
    expect(res.body.data).toMatchObject({
      aiStatus: expect.stringMatching(/^(PENDING|PROCESSING|DONE)$/),
      aiError: null,
      cv: { text, parseStatus: 'PARSED', textEnteredAt: expect.any(String) },
    });

    const done = await waitFor(created.id, settled);
    expect(done.aiStatus).toBe(AiStatus.Done);
    expect(done.score).not.toBeNull();
    for (const item of done.breakdown) {
      if (item.evidence) expect(text).toContain(item.evidence);
    }
    expect(extractCalls() - before).toBe(1);

    await auth(request(server()).put(`/api/v1/applications/${created.id}/cv-text`).send({ text }))
      .expect(409)
      .expect((r) => expect(r.body.code).toBe('CV_TEXT_NOT_EDITABLE'));
  });

  it('BR-AI-07: the database refuses a FAILED application without a reason', async () => {
    const app = await ds.getRepository(Application).findOneByOrFail({});
    for (const aiError of [null, '   ']) {
      await expect(
        ds.getRepository(Application).update(app.id, { aiStatus: AiStatus.Failed, aiError }),
      ).rejects.toThrow(/CK_applications_failed_has_reason/);
    }
  });

  it('retries invalid LLM output twice, then FAILED (BR-AI-06)', async () => {
    const content = await makeDocx([...SAMPLE_CV, INVALID_MARKER]);
    const created = await upload(ids.job, `bad-${run}@example.com`, content);
    const failed = await waitFor(created.id, settled);
    expect(failed.aiStatus).toBe(AiStatus.Failed);
    expect(failed.aiError).toContain(AI_ERROR.invalidOutput);
    expect(extractCalls(INVALID_MARKER)).toBe(3);
  });

  it('BR-AI-03: drops evidence the LLM made up and flags it for HR', async () => {
    const content = await makeDocx([...SAMPLE_CV, FABRICATE_MARKER]);
    const created = await upload(ids.job, `fake-${run}@example.com`, content);
    const done = await waitFor(created.id, settled);
    expect(done.aiStatus).toBe(AiStatus.Done);
    expect(done.cv?.text).not.toContain(FABRICATED);

    const react = done.requirements.find((r) => r.label === 'React')!;
    expect(done.breakdown.find((b) => b.requirementId === react.id)).toMatchObject({
      match: 0,
      evidence: null,
      rejectedEvidence: FABRICATED,
    });
    expect(done.flags).toContain(ScoreFlag.UnverifiedEvidence);
    for (const item of done.breakdown) {
      if (item.evidence) expect(done.cv?.text).toContain(item.evidence);
    }
  });

  it('suggests requirements from the JD without saving them', async () => {
    const res = await auth(
      request(server()).post(`/api/v1/jobs/${ids.job}/requirements/suggest`),
    ).expect(200);
    expect(res.body.data.map((r: { label: string }) => r.label)).toEqual([
      'NestJS',
      'PostgreSQL',
      'Docker',
      'Redis',
    ]);
    expect(res.body.data[0]).toEqual({
      label: 'NestJS',
      type: 'MUST',
      weight: 3,
      minYears: null,
      keywords: ['nestjs', 'nest.js'],
    });
    expect(await ds.getRepository(Job).findOneByOrFail({ id: ids.job })).toMatchObject({
      jdVersion: 2,
    });
  });

  it('returns 503 AI_UNAVAILABLE when the LLM fails', async () => {
    await ds.getRepository(Job).update(ids.job2, { jdText: `${BROKEN_JD} cần Docker` });
    const res = await auth(
      request(server()).post(`/api/v1/jobs/${ids.job2}/requirements/suggest`),
    ).expect(503);
    expect(res.body.code).toBe('AI_UNAVAILABLE');
  });
});
