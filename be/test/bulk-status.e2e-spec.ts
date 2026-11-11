import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditAction, AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { Interview, InterviewStatus } from '../src/modules/interviews/entities/interview.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

const S = ApplicationStatus;

// F2 · BR-APP-12: đổi trạng thái hàng loạt
describe('Bulk status change (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    hr: `b-hr-${run}@example.com`,
    hmA: `b-hma-${run}@example.com`,
    iv: `b-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const ids = { dep: '', job: '', interview: '' };
  const apps = {} as Record<'fresh' | 'screening' | 'hired' | 'offer' | 'withInterview', string>;
  const candidates: string[] = [];

  const server = () => app.getHttpServer();
  const bulk = (who: Who, body: object) =>
    request(server())
      .post('/api/v1/applications/bulk-status')
      .set('Authorization', `Bearer ${tokens[who]}`)
      .send(body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Hàng loạt ${run}`, code: `BK_${run}`.toUpperCase() });
    ids.dep = dep.id;
    const passwordHash = await bcrypt.hash(password, 4);
    const [hr] = await ds.getRepository(User).save([
      { email: emails.hr, fullName: 'B HR', role: Role.Hr, passwordHash },
      {
        email: emails.hmA,
        fullName: 'B HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      },
      { email: emails.iv, fullName: 'B IV', role: Role.Interviewer, passwordHash },
    ]);
    const job = await ds.getRepository(Job).save({
      title: `Hàng loạt ${run}`,
      departmentId: dep.id,
      status: JobStatus.Open,
      location: 'Hà Nội',
      jdText: `JD ${run}`,
      jdVersion: 1,
      createdBy: hr.id,
      publishedAt: new Date(),
    });
    ids.job = job.id;

    const seed: [keyof typeof apps, ApplicationStatus][] = [
      ['fresh', S.New],
      ['screening', S.Screening],
      ['hired', S.Hired],
      ['offer', S.Offer],
      ['withInterview', S.Interview],
    ];
    for (const [key, status] of seed) {
      const c = await ds.getRepository(Candidate).save({
        fullName: `Ứng viên ${key} ${run}`,
        email: `b-${key.toLowerCase()}-${run}@example.com`,
        consentAt: new Date(),
        consentVersion: 'v1',
      });
      candidates.push(c.id);
      const a = await ds
        .getRepository(Application)
        .save({ jobId: job.id, candidateId: c.id, cvFileId: null, status });
      apps[key] = a.id;
    }
    const iv = await ds.getRepository(Interview).save({
      applicationId: apps.withInterview,
      round: 1,
      scheduledAt: new Date(Date.now() + 86_400_000),
      location: 'Phòng họp 1',
      createdBy: hr.id,
    });
    ids.interview = iv.id;

    for (const who of Object.keys(emails) as Who[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[who], password })
        .expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(Application).delete({ jobId: ids.job });
    await ds.getRepository(Candidate).delete({ id: In(candidates) });
    await ds.getRepository(Job).delete({ id: ids.job });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: ids.dep });
    await app.close();
  });

  it('moves valid applications and reports each skipped one', async () => {
    const missing = randomUUID();
    const res = await bulk('hr', {
      ids: [apps.fresh, apps.screening, apps.hired, apps.offer, missing],
      status: S.Screening,
    }).expect(200);
    const data = res.body.data;
    expect(data.succeeded).toEqual([apps.fresh]);
    expect(data.unchanged).toEqual([apps.screening]);
    expect(data.failed).toHaveLength(3);
    expect(data.failed).toEqual(
      expect.arrayContaining([
        { id: apps.hired, code: 'INVALID_STATUS_TRANSITION' },
        { id: apps.offer, code: 'INVALID_STATUS_TRANSITION' },
        { id: missing, code: 'NOT_FOUND' },
      ]),
    );

    const history = await ds
      .getRepository(ApplicationStatusHistory)
      .findBy({ applicationId: apps.fresh, toStatus: S.Screening });
    expect(history).toHaveLength(1);
    const [audit] = await ds.getRepository(AuditLog).findBy({
      entityId: apps.fresh,
      action: AuditAction.ApplicationStatusChanged,
    });
    expect(audit.metadata).toMatchObject({ from: S.New, to: S.Screening });
    expect(audit.metadata.bulkId).toEqual(expect.any(String));
  });

  it('is safe to retry: a second identical call changes nothing', async () => {
    const res = await bulk('hr', { ids: [apps.fresh], status: S.Screening }).expect(200);
    expect(res.body.data).toEqual({ succeeded: [], unchanged: [apps.fresh], failed: [] });
  });

  it('rejects with one shared reason, cancels interviews, leaves offers to the HM', async () => {
    const res = await bulk('hr', {
      ids: [apps.withInterview, apps.offer],
      status: S.Rejected,
      reason: 'Không phù hợp văn hoá',
    }).expect(200);
    expect(res.body.data.succeeded).toEqual([apps.withInterview]);
    // BR-STS-05: từ chối offer phải qua decline-offer của HM
    expect(res.body.data.failed).toEqual([{ id: apps.offer, code: 'INVALID_STATUS_TRANSITION' }]);
    const offer = await ds.getRepository(Application).findOneByOrFail({ id: apps.offer });
    expect(offer.status).toBe(S.Offer);
    await vi.waitFor(async () => {
      const iv = await ds.getRepository(Interview).findOneByOrFail({ id: ids.interview });
      expect(iv.status).toBe(InterviewStatus.Cancelled);
    });
  });

  it('validates the request and the caller', async () => {
    const offer = await bulk('hr', { ids: [apps.fresh], status: S.Offer }).expect(400);
    expect(offer.body.code).toBe('BULK_STATUS_NOT_ALLOWED');
    const noReason = await bulk('hr', { ids: [apps.fresh], status: S.Rejected }).expect(400);
    expect(noReason.body.code).toBe('REJECT_REASON_REQUIRED');
    const tooMany = Array.from({ length: 101 }, () => randomUUID());
    const big = await bulk('hr', { ids: tooMany, status: S.Screening }).expect(400);
    expect(big.body.code).toBe('VALIDATION_FAILED');
    await bulk('hr', { ids: [apps.fresh, apps.fresh], status: S.Screening }).expect(400);
    await bulk('hr', { ids: [], status: S.Screening }).expect(400);
    await bulk('hmA', { ids: [apps.fresh], status: S.Screening }).expect(403);
    await bulk('iv', { ids: [apps.fresh], status: S.Screening }).expect(403);
  });
});
