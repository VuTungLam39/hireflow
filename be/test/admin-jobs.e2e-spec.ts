import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationSource } from '../src/common/enums/application-source.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { SAMPLE_CV } from '../src/modules/ai/testing/cv-fixtures.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile, CvParseStatus } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface Issue {
  id: string;
  aiStatus: AiStatus;
  aiError: string | null;
  stuck: boolean;
  candidate: { id: string; fullName: string };
  job: { id: string; title: string };
}

// F-OPS-01 · API Contract 4.10 · Backend Architecture 13 · BR-AI-08
describe('Admin AI queue (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const tokens = { admin: '', hr: '' };
  const ids = { dep: '', job: '' };
  const apps = { failed: '', stuck: '', fresh: '', done: '', noCv: '' };

  const server = () => app.getHttpServer();
  const as = (who: keyof typeof tokens, req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens[who]}`);
  const issues = async () =>
    (await as('admin', request(server()).get('/api/v1/admin/jobs/failed?limit=100')).expect(200))
      .body.data as Issue[];
  const statusOf = async (id: string) =>
    (await ds.getRepository(Application).findOneByOrFail({ id })).aiStatus;
  const waitDone = async (id: string) => {
    const until = Date.now() + 20_000;
    while (Date.now() < until) {
      if ((await statusOf(id)) === AiStatus.Done) return;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Timed out waiting for ${id}`);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Ops ${run}`, code: `OPS_${run}`.toUpperCase() });
    const passwordHash = await bcrypt.hash('Password123', 4);
    const [admin, hr] = await ds.getRepository(User).save([
      {
        email: `ops-admin-${run}@example.com`,
        fullName: 'Ops Admin',
        role: Role.Admin,
        passwordHash,
      },
      { email: `ops-hr-${run}@example.com`, fullName: 'Ops HR', role: Role.Hr, passwordHash },
    ]);
    const job = await ds.getRepository(Job).save({
      title: `Ops Backend ${run}`,
      departmentId: dep.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: 'Tuyển Backend Developer biết NestJS và PostgreSQL.',
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    await ds.getRepository(JobRequirement).save({
      jobId: job.id,
      jdVersion: 1,
      position: 1,
      label: 'NestJS',
      type: RequirementType.Must,
      weight: 3,
      minYears: null,
      keywords: ['nestjs'],
    });
    Object.assign(ids, { dep: dep.id, job: job.id });

    const make = async (key: keyof typeof apps, aiStatus: AiStatus, withCv = true) => {
      const candidate = await ds.getRepository(Candidate).save({
        fullName: `Ops ${run} ${key}`,
        email: `ops-${key.toLowerCase()}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      });
      const text = SAMPLE_CV.join('\n');
      const cv = withCv
        ? await ds.getRepository(CvFile).save({
            candidateId: candidate.id,
            storageKey: `cv/test/${run}-${key}.docx`,
            originalName: 'cv.docx',
            mime: DOCX,
            sizeBytes: text.length,
            sha256: createHash('sha256').update(`${run}-${key}`).digest('hex'),
            parseStatus: CvParseStatus.Parsed,
            text,
          })
        : null;
      const saved = await ds.getRepository(Application).save({
        jobId: job.id,
        candidateId: candidate.id,
        cvFileId: cv?.id ?? null,
        source: ApplicationSource.HrUpload,
        aiStatus,
        aiError: aiStatus === AiStatus.Failed ? 'Dịch vụ AI tạm thời không phản hồi.' : null,
        score: aiStatus === AiStatus.Done ? 50 : null,
      });
      apps[key] = saved.id;
    };
    await make('failed', AiStatus.Failed);
    await make('stuck', AiStatus.Pending);
    await make('fresh', AiStatus.Pending);
    await make('done', AiStatus.Done);
    await make('noCv', AiStatus.Failed, false);
    await ds.query(
      `UPDATE applications SET created_at = now() - interval '10 minutes' WHERE id = $1`,
      [apps.stuck],
    );

    for (const [key, user] of [
      ['admin', admin],
      ['hr', hr],
    ] as const) {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'Password123' })
        .expect(200);
      tokens[key] = login.body.data.tokens.accessToken;
    }
  }, 30_000);

  afterAll(async () => {
    const appRows = await ds.getRepository(Application).find({ where: { jobId: ids.job } });
    const candidateIds = appRows.map((a) => a.candidateId);
    await app.close();
    if (!ds.isInitialized) await ds.initialize();
    await ds.getRepository(Application).delete({ jobId: ids.job });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(JobRequirement).delete({ jobId: ids.job });
    await ds.getRepository(Job).delete({ id: ids.job });
    await ds
      .getRepository(User)
      .delete({ email: In([`ops-admin-${run}@example.com`, `ops-hr-${run}@example.com`]) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await ds.destroy();
  }, 30_000);

  it('only Admin (ops:manage) can use the queue endpoints', async () => {
    await as('hr', request(server()).get('/api/v1/admin/jobs/failed')).expect(403);
    await as('hr', request(server()).get('/api/v1/admin/queues')).expect(403);
    await as('hr', request(server()).post(`/api/v1/admin/jobs/${apps.failed}/retry`)).expect(403);
    await as('hr', request(server()).post('/api/v1/admin/jobs/retry-all')).expect(403);
    await request(server()).get('/api/v1/admin/jobs/failed').expect(401);
  });

  it('Backend Architecture 13: lists FAILED and PENDING older than 5 minutes, nothing else', async () => {
    const mine = (await issues()).filter((i) => i.job.id === ids.job);
    expect(mine.map((i) => i.id).sort()).toEqual([apps.failed, apps.stuck].sort());
    const byId = Object.fromEntries(mine.map((i) => [i.id, i]));
    expect(byId[apps.failed]).toMatchObject({
      aiStatus: AiStatus.Failed,
      stuck: false,
      aiError: 'Dịch vụ AI tạm thời không phản hồi.',
      candidate: { fullName: `Ops ${run} failed` },
      job: { title: `Ops Backend ${run}` },
    });
    expect(byId[apps.stuck]).toMatchObject({ aiStatus: AiStatus.Pending, stuck: true });
  });

  it('BR-AI-08: retries one application, which then finishes', async () => {
    const res = await as(
      'admin',
      request(server()).post(`/api/v1/admin/jobs/${apps.failed}/retry`),
    ).expect(202);
    expect(res.body.data).toBeNull();
    await waitDone(apps.failed);
  });

  it('answers 404 for an application that is not failed or stuck', async () => {
    await as('admin', request(server()).post(`/api/v1/admin/jobs/${apps.done}/retry`)).expect(404);
    await as('admin', request(server()).post(`/api/v1/admin/jobs/${apps.fresh}/retry`)).expect(404);
    await as('admin', request(server()).post(`/api/v1/admin/jobs/${apps.noCv}/retry`)).expect(404);
  });

  it('retries every failed or stuck application at once', async () => {
    const res = await as('admin', request(server()).post('/api/v1/admin/jobs/retry-all')).expect(
      202,
    );
    expect(res.body.data.queued).toBeGreaterThanOrEqual(1);
    await waitDone(apps.stuck);
    expect((await issues()).filter((i) => i.job.id === ids.job)).toEqual([]);
  });

  it('reports job counts for every pipeline queue', async () => {
    const res = await as('admin', request(server()).get('/api/v1/admin/queues')).expect(200);
    expect(res.body.data.map((q: { name: string }) => q.name)).toEqual([
      'parse-cv',
      'extract-cv',
      'score',
      'embed-cv',
    ]);
    for (const q of res.body.data) {
      expect(q).toEqual({
        name: q.name,
        waiting: expect.any(Number),
        active: expect.any(Number),
        delayed: expect.any(Number),
        failed: expect.any(Number),
      });
    }
  });
});
