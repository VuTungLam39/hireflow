import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationSource } from '../src/common/enums/application-source.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const S = ApplicationStatus;
const DAY_MS = 86_400_000;

// F1 · BR-REP-01: báo cáo phễu
describe('Funnel report (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `f-hr-${run}@example.com`,
    hmA: `f-hma-${run}@example.com`,
    iv: `f-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', jobA: '', jobB: '' };
  const apps: string[] = [];
  const candidates: string[] = [];

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const funnel = (who: Who, qs: string) =>
    as(who, request(server()).get(`/api/v1/dashboard/funnel?${qs}`));
  const move = (id: string, status: ApplicationStatus, reason?: string) =>
    as('hr', request(server()).patch(`/api/v1/applications/${id}/status`))
      .send({ status, reason })
      .expect(200);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const [depA, depB] = await ds.getRepository(Department).save([
      { name: `Phễu A ${run}`, code: `FA_${run}`.toUpperCase() },
      { name: `Phễu B ${run}`, code: `FB_${run}`.toUpperCase() },
    ]);
    ids.depA = depA.id;
    ids.depB = depB.id;
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'F HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'F HM A',
        role: Role.HiringManager,
        departmentId: depA.id,
        passwordHash,
      },
      { email: emails.iv, fullName: 'F IV', role: Role.Interviewer, passwordHash },
    ]);
    const job = (departmentId: string) => ({
      title: `Phễu ${run}`,
      departmentId,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: `JD ${run}`,
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    const [jobA, jobB] = await ds.getRepository(Job).save([job(depA.id), job(depB.id)]);
    ids.jobA = jobA.id;
    ids.jobB = jobB.id;

    // 3 hồ sơ nộp 2 ngày trước: 2 từ form công khai, 1 HR tải hộ
    const appliedAt = new Date(Date.now() - 2 * DAY_MS);
    for (const [i, source] of [
      ApplicationSource.PublicForm,
      ApplicationSource.PublicForm,
      ApplicationSource.HrUpload,
    ].entries()) {
      const c = await ds.getRepository(Candidate).save({
        fullName: `Ứng viên phễu ${i} ${run}`,
        email: `f-c${i}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      });
      candidates.push(c.id);
      const a = await ds.getRepository(Application).save({
        jobId: jobA.id,
        candidateId: c.id,
        cvFileId: null,
        source,
        status: S.New,
        statusChangedAt: appliedAt,
        createdAt: appliedAt,
      });
      apps.push(a.id);
      await ds.getRepository(ApplicationStatusHistory).insert({
        applicationId: a.id,
        fromStatus: null,
        toStatus: S.New,
        changedAt: appliedAt,
      });
    }

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }

    await move(apps[0], S.Screening);
    await move(apps[0], S.Interview);
    await move(apps[1], S.Screening);
    await move(apps[2], S.Rejected, 'Thiếu kinh nghiệm');
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ jobId: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(Candidate).delete({ id: In(candidates) });
    await ds.getRepository(Job).delete({ id: In([ids.jobA, ids.jobB]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  it('records how long the application stayed in the previous status', async () => {
    const rows = await ds.getRepository(ApplicationStatusHistory).find({
      where: { applicationId: apps[0] },
      order: { changedAt: 'ASC' },
    });
    expect(rows.map((r) => r.toStatus)).toEqual([S.New, S.Screening, S.Interview]);
    expect(rows[0].prevStageSeconds).toBeNull();
    // ở NEW khoảng 2 ngày, ở SCREENING vài giây
    expect(rows[1].prevStageSeconds).toBeGreaterThanOrEqual(2 * 86_400 - 60);
    expect(rows[2].prevStageSeconds).toBeLessThan(60);
  });

  it('builds the funnel for one job within the cohort', async () => {
    const res = await funnel('hmA', `jobId=${ids.jobA}`).expect(200);
    const f = res.body.data;
    expect(f.cohort).toBe(3);
    expect(f.stages.map((s: { reached: number }) => s.reached)).toEqual([3, 2, 1, 0, 0]);
    expect(f.stages[0]).toMatchObject({ status: S.New, rejected: 1, medianDaysInStage: 2 });
    expect(f.stages[1].conversionFromPrev).toBe(0.667);
    expect(f.bySource).toEqual([
      { source: ApplicationSource.HrUpload, cohort: 1, reachedInterview: 0, hired: 0 },
      { source: ApplicationSource.PublicForm, cohort: 2, reachedInterview: 1, hired: 0 },
    ]);
    expect(f.generatedAt).toEqual(expect.any(String));
  });

  it('excludes applications submitted outside the range', async () => {
    const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const old = day(Date.now() - 30 * DAY_MS);
    const res = await funnel('hr', `jobId=${ids.jobA}&from=${old}&to=${old}`).expect(200);
    expect(res.body.data.cohort).toBe(0);
  });

  it("hides another department's job and rejects bad ranges and interviewers", async () => {
    const other = await funnel('hmA', `jobId=${ids.jobB}`).expect(404);
    expect(other.body.code).toBe('NOT_FOUND');
    const wide = await funnel('hr', 'from=2025-01-01&to=2026-06-01').expect(400);
    expect(wide.body.code).toBe('VALIDATION_FAILED');
    await funnel('hr', 'from=2026-06-02&to=2026-06-01').expect(400);
    await funnel('hr', 'from=2026-6-1').expect(400);
    await funnel('iv', '').expect(403);
  });
});
