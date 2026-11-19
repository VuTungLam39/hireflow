import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { AiStatus } from '../src/common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { Notification } from '../src/modules/notifications/entities/notification.entity.js';
import { Offer, OfferStatus } from '../src/modules/offers/entities/offer.entity.js';
import { OffersService } from '../src/modules/offers/offers.service.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

// MVP 3.1 · F-OFFER-01, BR-OFFER-01 → 05, BR-STS-05 (Q1, Q7)
describe('Offers (e2e)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = {
    admin: `of-admin-${run}@example.com`,
    hr: `of-hr-${run}@example.com`,
    hmDept: `of-hmd-${run}@example.com`,
    hmJob: `of-hmj-${run}@example.com`,
    iv: `of-iv-${run}@example.com`,
  };
  type Who = keyof typeof emails;
  const tokens = {} as Record<Who, string>;
  const userIds = {} as Record<Who, string>;
  const ids = { depA: '', depB: '', job: '' };
  const apps = { main: '', screening: '', decline: '', expire: '', withdraw: '' };
  const candidates: string[] = [];
  const offer = {
    salaryAmount: 30_000_000,
    startDate: '2099-02-01',
    respondBy: '2099-01-15',
    note: 'Thử việc 2 tháng',
  };

  const server = () => app.getHttpServer();
  const as = (who: Who, req: request.Test) => req.set('Authorization', `Bearer ${tokens[who]}`);
  const create = (who: Who, appId: string, body: object = offer) =>
    as(who, request(server()).post(`/api/v1/applications/${appId}/offers`)).send(body);
  const act = (who: Who, id: string, action: string, body: object = {}) =>
    as(who, request(server()).patch(`/api/v1/offers/${id}/${action}`)).send(body);
  const statusOf = async (appId: string) =>
    (await ds.getRepository(Application).findOneByOrFail({ id: appId })).status;
  const approved = async (appId: string) => {
    const id = (await create('hr', appId).expect(201)).body.data.id;
    await act('hr', id, 'submit').expect(200);
    await act('hmJob', id, 'approve').expect(200);
    return id;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    const [depA, depB] = await ds.getRepository(Department).save(
      withOrg([
        { name: `Offer A ${run}`, code: `OFA_${run}`.toUpperCase() },
        { name: `Offer B ${run}`, code: `OFB_${run}`.toUpperCase() },
      ]),
    );
    Object.assign(ids, { depA: depA.id, depB: depB.id });
    const passwordHash = await bcrypt.hash(password, 4);
    const roles: Record<Who, [Role, string | null]> = {
      admin: [Role.Admin, null],
      hr: [Role.Hr, null],
      hmDept: [Role.HiringManager, depA.id],
      hmJob: [Role.HiringManager, depB.id],
      iv: [Role.Interviewer, null],
    };
    for (const who of Object.keys(emails) as Who[]) {
      const [role, departmentId] = roles[who];
      const u = await ds
        .getRepository(User)
        .save(
          withOrg({ email: emails[who], fullName: `OF ${who}`, role, departmentId, passwordHash }),
        );
      userIds[who] = u.id;
    }
    const job = await ds.getRepository(Job).save(
      withOrg({
        title: `Tin offer ${run}`,
        departmentId: depA.id,
        hiringManagerId: userIds.hmJob,
        status: JobStatus.Open,
        location: 'Hà Nội',
        jdText: 'JD',
        jdVersion: 1,
        createdBy: userIds.hr,
        publishedAt: new Date(),
      }),
    );
    ids.job = job.id;
    const makeApp = async (key: string, status: ApplicationStatus) => {
      const c = await ds.getRepository(Candidate).save(
        withOrg({
          fullName: `Ứng viên offer ${key} ${run}`,
          email: `of-c-${key}-${run}@example.com`,
          consentAt: new Date(),
          consentVersion: 'v1',
        }),
      );
      candidates.push(c.id);
      const cv = await ds.getRepository(CvFile).save(
        withOrg({
          candidateId: c.id,
          storageKey: `cv/test/${run}-of-${key}.pdf`,
          originalName: `${key}.pdf`,
          mime: 'application/pdf',
          sizeBytes: 100,
          sha256: randomUUID().replace(/-/g, '').padEnd(64, '0'),
          text: 'NestJS',
        }),
      );
      const a = await ds.getRepository(Application).save(
        withOrg({
          jobId: job.id,
          candidateId: c.id,
          cvFileId: cv.id,
          status,
          aiStatus: AiStatus.Done,
          score: 80,
          scoreBreakdown: [],
        }),
      );
      return a.id;
    };
    apps.main = await makeApp('main', ApplicationStatus.Interview);
    apps.screening = await makeApp('scr', ApplicationStatus.Screening);
    apps.decline = await makeApp('dec', ApplicationStatus.Interview);
    apps.expire = await makeApp('exp', ApplicationStatus.Interview);
    apps.withdraw = await makeApp('wd', ApplicationStatus.Interview);
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
    await ds.getRepository(CvFile).delete({ candidateId: In(candidates) });
    await ds.getRepository(Candidate).delete({ id: In(candidates) });
    await ds.getRepository(Job).delete({ id: ids.job });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ id: In([ids.depA, ids.depB]) });
    await app.close();
  });

  it('BR-OFFER-04: interviewers cannot see offers; the department manager can read them', async () => {
    await as('iv', request(server()).get(`/api/v1/applications/${apps.main}/offers`)).expect(403);
    const res = await as(
      'hmDept',
      request(server()).get(`/api/v1/applications/${apps.main}/offers`),
    ).expect(200);
    expect(res.body.data).toEqual([]);
  });

  it('BR-OFFER-01: only HR/Admin draft an offer, only at INTERVIEW, with valid dates, one open offer per application', async () => {
    expect((await create('hr', apps.screening).expect(409)).body.code).toBe(
      'INVALID_OFFER_TRANSITION',
    );
    const past = await create('hr', apps.main, { ...offer, respondBy: '2000-01-01' }).expect(400);
    expect(past.body.errors[0].field).toBe('respondBy');
    const late = await create('hr', apps.main, { ...offer, startDate: '2099-01-01' }).expect(400);
    expect(late.body.errors[0].field).toBe('startDate');
    await create('hmJob', apps.main).expect(403);

    const res = await create('hr', apps.main).expect(201);
    expect(res.body.data).toMatchObject({
      status: 'DRAFT',
      salaryAmount: 30_000_000,
      salaryCurrency: 'VND',
      salaryPeriod: 'MONTH',
      canApprove: false,
      letter: { jobTitle: `Tin offer ${run}`, candidateName: `Ứng viên offer main ${run}` },
    });
    expect((await create('hr', apps.main).expect(409)).body.code).toBe('OFFER_EXISTS');
  });

  it('BR-OFFER-02, Q7: submit → only the job hiring manager (or Admin) approves; return sends it back to draft', async () => {
    const [mine] = (
      await as('hr', request(server()).get(`/api/v1/applications/${apps.main}/offers`)).expect(200)
    ).body.data;
    await as('hr', request(server()).patch(`/api/v1/offers/${mine.id}`))
      .send({ salaryAmount: 32_000_000 })
      .expect(200);
    await act('hmJob', mine.id, 'approve').expect(409);
    await act('hr', mine.id, 'submit').expect(200);
    const notified = await ds.getRepository(Notification).findOneBy({
      userId: userIds.hmJob,
      applicationId: apps.main,
      type: 'OFFER_PENDING_APPROVAL' as Notification['type'],
    });
    expect(notified).not.toBeNull();

    await act('hr', mine.id, 'approve').expect(403);
    expect((await act('hmDept', mine.id, 'approve').expect(403)).body.code).toBe(
      'OFFER_APPROVER_REQUIRED',
    );
    await act('hmJob', mine.id, 'return', {}).expect(400);
    const back = await act('hmJob', mine.id, 'return', { reason: 'Lương vượt khung' }).expect(200);
    expect(back.body.data).toMatchObject({ status: 'DRAFT', statusReason: 'Lương vượt khung' });

    await act('hr', mine.id, 'submit').expect(200);
    const ok = await act('hmJob', mine.id, 'approve').expect(200);
    expect(ok.body.data).toMatchObject({
      status: 'APPROVED',
      approvedBy: { id: userIds.hmJob },
      statusReason: null,
    });
    await as('hr', request(server()).patch(`/api/v1/offers/${mine.id}`))
      .send({ salaryAmount: 1 })
      .expect(409);
  });

  it('BR-STS-05: sending moves the application to OFFER, accepting to HIRED; /status cannot do either', async () => {
    const [mine] = (
      await as('hr', request(server()).get(`/api/v1/applications/${apps.main}/offers`)).expect(200)
    ).body.data;
    await as('hr', request(server()).patch(`/api/v1/applications/${apps.main}/status`))
      .send({ status: 'OFFER' })
      .expect(409);
    await act('hr', mine.id, 'accept').expect(409);
    await act('hr', mine.id, 'send').expect(200);
    expect(await statusOf(apps.main)).toBe(ApplicationStatus.Offer);
    await act('hr', mine.id, 'withdraw', { reason: 'Đổi ý' }).expect(409);

    const done = await act('hr', mine.id, 'accept').expect(200);
    expect(done.body.data.status).toBe('ACCEPTED');
    expect(await statusOf(apps.main)).toBe(ApplicationStatus.Hired);
    const history = await ds.getRepository(ApplicationStatusHistory).find({
      where: { applicationId: apps.main },
      order: { changedAt: 'ASC' },
    });
    expect(history.map((h) => [h.toStatus, h.changedBy])).toEqual([
      [ApplicationStatus.Offer, userIds.hr],
      [ApplicationStatus.Hired, userIds.hr],
    ]);
    const logs = await ds.getRepository(AuditLog).findBy({ entityId: mine.id });
    expect(logs.map((l) => l.action)).toEqual(
      expect.arrayContaining(['OFFER_CREATED', 'OFFER_APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED']),
    );
    expect(JSON.stringify(logs.map((l) => l.metadata))).not.toMatch(/32000000|salary/);
  });

  it('declining (Admin approved: allowed for any offer) rejects the application with CANDIDATE_DECLINED', async () => {
    const id = (await create('hr', apps.decline).expect(201)).body.data.id;
    await act('hr', id, 'submit').expect(200);
    await act('admin', id, 'approve').expect(200);
    await act('hr', id, 'send').expect(200);
    await act('hr', id, 'decline', { reason: 'Nhận việc nơi khác' }).expect(200);
    expect(await statusOf(apps.decline)).toBe(ApplicationStatus.Rejected);
    const last = await ds.getRepository(ApplicationStatusHistory).findOneOrFail({
      where: { applicationId: apps.decline, toStatus: ApplicationStatus.Rejected },
    });
    expect(last).toMatchObject({ reasonCode: 'CANDIDATE_DECLINED', reason: 'Nhận việc nơi khác' });
  });

  it('withdrawing before sending frees the application for a new offer', async () => {
    const id = await approved(apps.withdraw);
    await act('hr', id, 'withdraw', {}).expect(400);
    await act('hr', id, 'withdraw', { reason: 'Tin tạm dừng' }).expect(200);
    expect(await statusOf(apps.withdraw)).toBe(ApplicationStatus.Interview);
    await create('hr', apps.withdraw).expect(201);
  });

  it('BR-OFFER-03: a sent offer past its deadline expires; the system rejects the application', async () => {
    const id = await approved(apps.expire);
    await act('hr', id, 'send').expect(200);
    await ds.query(`UPDATE offers SET respond_by = '2000-01-01' WHERE id = $1`, [id]);
    expect(await app.get(OffersService).expireOverdue()).toBeGreaterThanOrEqual(1);
    expect((await ds.getRepository(Offer).findOneByOrFail({ id })).status).toBe(
      OfferStatus.Expired,
    );
    expect(await statusOf(apps.expire)).toBe(ApplicationStatus.Rejected);
    const last = await ds.getRepository(ApplicationStatusHistory).findOneOrFail({
      where: { applicationId: apps.expire, toStatus: ApplicationStatus.Rejected },
    });
    expect(last).toMatchObject({ changedBy: null, reasonCode: 'CANDIDATE_DECLINED' });
  });

  it('BR-DATA-03: anonymizing the candidate deletes their offers (salary is personal data)', async () => {
    const candidateId = (await ds.getRepository(Application).findOneByOrFail({ id: apps.decline }))
      .candidateId;
    await as('admin', request(server()).post(`/api/v1/candidates/${candidateId}/anonymize`)).expect(
      200,
    );
    expect(await ds.getRepository(Offer).countBy({ applicationId: apps.decline })).toBe(0);
  });
});
