import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationSource } from '../src/common/enums/application-source.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { LLM_PROVIDER } from '../src/modules/ai/ai.types.js';
import { fakeExtract, FakeLlmProvider } from '../src/modules/ai/providers/fake.llm.js';
import { makeDocx } from '../src/modules/ai/testing/cv-fixtures.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import {
  JobRequirement,
  RequirementType,
} from '../src/modules/jobs/entities/job-requirement.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// API Contract 4.6, 4.7, 4.8, 4.9 · US-03, US-04, FR-DASH · BR-APP-01 → 07, BR-FILE-03, BR-JOB-07
describe('Public jobs, CV files, dashboard (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `p-hr-${run}@example.com`,
    hmA: `p-hma-${run}@example.com`,
    hmB: `p-hmb-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', open: '', draft: '', closed: '', other: '' };
  let cvDocx: Buffer;

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const apply = (jobId: string, fields: Record<string, string>, file: Buffer | null = cvDocx) => {
    const req = request(server()).post(`/api/v1/public/jobs/${jobId}/apply`);
    for (const [k, v] of Object.entries(fields)) req.field(k, v);
    if (file) req.attach('cv', file, { filename: 'CV Ứng viên.docx', contentType: DOCX });
    return req;
  };
  const form = (n: number, extra: Record<string, string> = {}) => ({
    fullName: `Nguyễn Văn Công Khai ${run}`,
    email: `p-c${n}-${run}@gmail.com`,
    phone: '0912345678',
    consent: 'true',
    ...extra,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LLM_PROVIDER)
      .useValue(new FakeLlmProvider({ 'extract-cv': fakeExtract }))
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `Công khai A ${run}`, code: `PA_${run}`.toUpperCase() },
      { name: `Công khai B ${run}`, code: `PB_${run}`.toUpperCase() },
    ]);
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'P HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'P HM A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      {
        email: emails.hmB,
        fullName: 'P HM B',
        role: Role.HiringManager,
        departmentId: depB.id,
        passwordHash,
      },
    ]);
    const job = (title: string, status: JobStatus, departmentId = depA.id) => ({
      title: `${title} ${run}`,
      departmentId,
      status,
      location: 'Đà Nẵng',
      jdText: `Mô tả công việc ${run}`,
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: status === JobStatus.Draft ? null : new Date(),
      closedAt: status === JobStatus.Closed ? new Date() : null,
    });
    const [open, draft, closed, other] = await ds
      .getRepository(Job)
      .save([
        job('Tuyển công khai', JobStatus.Open),
        job('Job nháp', JobStatus.Draft),
        job('Job đã đóng', JobStatus.Closed),
        job('Job phòng B', JobStatus.Open, depB.id),
      ]);
    await ds.getRepository(JobRequirement).save({
      jobId: open.id,
      jdVersion: 1,
      position: 1,
      label: 'NestJS',
      type: RequirementType.Must,
      weight: 3,
      minYears: 2,
      keywords: ['nestjs', 'bí mật nội bộ'],
    });
    Object.assign(ids, {
      depA: depA.id,
      depB: depB.id,
      open: open.id,
      draft: draft.id,
      closed: closed.id,
      other: other.id,
    });
    cvDocx = await makeDocx([`Ứng viên ${run}`, '3 năm phát triển API bằng NestJS và PostgreSQL.']);

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    const jobIds = Object.values(ids).filter((id) => id && id !== ids.depA && id !== ids.depB);
    const apps = await ds.getRepository(Application).findBy({ jobId: In(jobIds) });
    const candidateIds = [...new Set(apps.map((a) => a.candidateId))];
    const files = await ds.getRepository(CvFile).findBy({ candidateId: In(candidateIds) });
    for (const f of files) await rm(join(process.cwd(), 'storage', f.storageKey), { force: true });
    await ds.getRepository(Application).delete({ jobId: In(jobIds) });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: In(jobIds) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  describe('public jobs (US-03, BR-JOB-07)', () => {
    it('lists only OPEN jobs without login', async () => {
      const res = await request(server()).get(`/api/v1/public/jobs?search=${run}`).expect(200);
      const titles = res.body.data.map((j: { title: string }) => j.title);
      expect(titles).toEqual(
        expect.arrayContaining([`Tuyển công khai ${run}`, `Job phòng B ${run}`]),
      );
      expect(titles).not.toContain(`Job nháp ${run}`);
      expect(titles).not.toContain(`Job đã đóng ${run}`);
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        title: expect.any(String),
        location: 'Đà Nẵng',
        department: { name: expect.any(String) },
        publishedAt: expect.any(String),
      });
    });

    it('searches titles without diacritics', async () => {
      const res = await request(server())
        .get(`/api/v1/public/jobs?search=${encodeURIComponent(`tuyen cong khai ${run}`)}`)
        .expect(200);
      expect(res.body.data.map((j: { id: string }) => j.id)).toEqual([ids.open]);
    });

    it('shows requirement label and type only', async () => {
      const res = await request(server()).get(`/api/v1/public/jobs/${ids.open}`).expect(200);
      expect(res.body.data.requirements).toEqual([{ label: 'NestJS', type: 'MUST' }]);
      expect(JSON.stringify(res.body.data)).not.toContain('bí mật nội bộ');
    });

    it.each(['draft', 'closed'] as const)('BR-APP-02: %s job is 404', async (key) => {
      await request(server()).get(`/api/v1/public/jobs/${ids[key]}`).expect(404);
    });
  });

  describe('public apply (US-03, BR-APP-01 → 07)', () => {
    it('BR-APP-07: creates a NEW application and returns no id, score or status', async () => {
      const res = await apply(ids.open, form(1)).expect(201);
      expect(res.body.data).toBeNull();

      const candidate = await ds
        .getRepository(Candidate)
        .findOneByOrFail({ email: `p-c1-${run}@gmail.com` });
      expect(candidate.consentVersion).toBe('v1');
      const created = await ds
        .getRepository(Application)
        .findOneByOrFail({ candidateId: candidate.id });
      expect(created).toMatchObject({
        jobId: ids.open,
        status: ApplicationStatus.New,
        source: ApplicationSource.PublicForm,
      });
      const history = await ds
        .getRepository(ApplicationStatusHistory)
        .findBy({ applicationId: created.id });
      expect(history).toEqual([
        expect.objectContaining({ fromStatus: null, toStatus: 'NEW', changedBy: null }),
      ]);
    });

    it('BR-APP-03: the same email cannot apply twice to the same job', async () => {
      const res = await apply(ids.open, form(1)).expect(409);
      expect(res.body.code).toBe('APPLICATION_DUPLICATED');
    });

    it('BR-APP-06: honeypot answers 201 but stores nothing', async () => {
      await apply(ids.open, form(2, { website: 'http://spam.example' })).expect(201);
      expect(await ds.getRepository(Candidate).existsBy({ email: `p-c2-${run}@gmail.com` })).toBe(
        false,
      );
    });

    it('BR-APP-04: without consent nothing is stored', async () => {
      const res = await apply(ids.open, form(3, { consent: 'false' })).expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'consent' })]);
      expect(await ds.getRepository(Candidate).existsBy({ email: `p-c3-${run}@gmail.com` })).toBe(
        false,
      );
    });

    it('BR-APP-01: phone is required on the public form', async () => {
      const { phone: _phone, ...rest } = form(4);
      const res = await apply(ids.open, rest).expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'phone' })]);
    });

    it('BR-FILE-01: rejects a file that is not PDF/DOCX', async () => {
      const req = request(server())
        .post(`/api/v1/public/jobs/${ids.open}/apply`)
        .field(form(5))
        .attach('cv', Buffer.from('MZ fake exe'), {
          filename: 'cv.pdf',
          contentType: 'application/pdf',
        });
      expect((await req.expect(400)).body.code).toBe('FILE_TYPE_NOT_ALLOWED');
    });

    it.each(['draft', 'closed'] as const)('BR-APP-02: applying to a %s job is 404', async (key) => {
      await apply(ids[key], form(6)).expect(404);
    });
  });

  describe('CV file link (US-04, BR-FILE-03)', () => {
    let fileId = '';

    beforeAll(async () => {
      const candidate = await ds
        .getRepository(Candidate)
        .findOneByOrFail({ email: `p-c1-${run}@gmail.com` });
      fileId = (await ds.getRepository(CvFile).findOneByOrFail({ candidateId: candidate.id })).id;
    });

    it('gives HR a 5-minute link that serves the original file', async () => {
      const res = await as('hr', request(server()).get(`/api/v1/files/${fileId}/url`)).expect(200);
      const expiresIn = new Date(res.body.data.expiresAt).getTime() - Date.now();
      expect(expiresIn).toBeGreaterThan(4 * 60_000);
      expect(expiresIn).toBeLessThanOrEqual(5 * 60_000);

      const file = await request(server()).get(res.body.data.url).responseType('blob').expect(200);
      expect(file.headers['content-type']).toContain(DOCX);
      expect(file.headers['content-disposition']).toContain(encodeURIComponent('CV Ứng viên.docx'));
      expect(Buffer.compare(file.body as Buffer, cvDocx)).toBe(0);
    });

    it('rejects a tampered signature', async () => {
      const res = await as('hr', request(server()).get(`/api/v1/files/${fileId}/url`)).expect(200);
      const url = new URL(res.body.data.url, 'http://local');
      url.searchParams.set('signature', 'f'.repeat(64));
      await request(server()).get(`${url.pathname}${url.search}`).expect(404);
    });

    it('BR-ACC-07: Hiring Manager of the department gets a link, another department gets 404', async () => {
      await as('hmA', request(server()).get(`/api/v1/files/${fileId}/url`)).expect(200);
      await as('hmB', request(server()).get(`/api/v1/files/${fileId}/url`)).expect(404);
    });
  });

  describe('dashboard (FR-DASH)', () => {
    it('BR-ACC-07: Hiring Manager only sees their department', async () => {
      const res = await as('hmA', request(server()).get('/api/v1/dashboard/summary')).expect(200);
      const { totals, byStatus, byJob } = res.body.data;
      expect(Object.keys(byStatus).sort()).toEqual(Object.values(ApplicationStatus).sort());
      expect(Object.values(byStatus).reduce((a: number, b) => a + (b as number), 0)).toBe(
        totals.applications,
      );
      expect(totals).toMatchObject({ applications: 1, openJobs: 1 });
      expect(byJob).toEqual([
        {
          jobId: ids.open,
          title: `Tuyển công khai ${run}`,
          total: 1,
          avgScore: expect.toBeOneOf([null, expect.any(Number)]),
          hired: 0,
        },
      ]);

      const other = await as('hmB', request(server()).get('/api/v1/dashboard/summary')).expect(200);
      expect(other.body.data.totals).toMatchObject({ applications: 0, openJobs: 1 });
      expect(other.body.data.byJob).toEqual([]);
    });

    it('HR sees every department', async () => {
      const res = await as('hr', request(server()).get('/api/v1/dashboard/summary')).expect(200);
      expect(res.body.data.byJob.map((j: { jobId: string }) => j.jobId)).toContain(ids.open);
      expect(res.body.data.totals.openJobs).toBeGreaterThanOrEqual(2);
    });
  });

  it('API Contract 4.8: AI chat answers 503 AI_UNAVAILABLE until RAG is ready', async () => {
    const res = await as(
      'hr',
      request(server()).post('/api/v1/ai/chat').send({ question: 'Ai biết Kafka?' }),
    ).expect(503);
    expect(res.body.code).toBe('AI_UNAVAILABLE');
  });
});
