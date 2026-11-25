import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource, In, Like } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApplicationStatus } from '../src/common/enums/application-status.enum.js';
import { Role } from '../src/common/enums/role.enum.js';
import { makeDocx } from '../src/modules/ai/testing/cv-fixtures.js';
import { WITHDRAW_REASON } from '../src/modules/applications/application-tracking.service.js';
import { ApplicationStatusHistory } from '../src/modules/applications/entities/application-status-history.entity.js';
import { Application } from '../src/modules/applications/entities/application.entity.js';
import { AuditAction, AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import { AuthToken, AuthTokenKind } from '../src/modules/auth/entities/auth-token.entity.js';
import { Candidate } from '../src/modules/candidates/entities/candidate.entity.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import {
  EMAIL_PROVIDER,
  EmailTemplate,
  type EmailMessage,
  type EmailProvider,
} from '../src/modules/email/email.types.js';
import { EmailOutbox } from '../src/modules/email/entities/email-outbox.entity.js';
import { CvFile } from '../src/modules/files/entities/cv-file.entity.js';
import { Job, JobStatus } from '../src/modules/jobs/entities/job.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// MVP 3 · US-26, F-APP-12, BR-APP-14
describe('Application tracking (e2e)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const adminEmail = `t-admin-${run}@example.com`;
  const sent: EmailMessage[] = [];
  let adminToken = '';
  let jobId = '';
  let depId = '';
  let cv: Buffer;

  const server = () => app.getHttpServer();
  const emailOf = (n: number) => `t-c${n}-${run}@gmail.com`;
  const apply = (n: number) =>
    request(server())
      .post(`/api/v1/public/jobs/${jobId}/apply`)
      .field({
        fullName: `Ứng Viên Theo Dõi ${run}`,
        email: emailOf(n),
        phone: '0912345678',
        consent: 'true',
      })
      .attach('cv', cv, { filename: 'cv.docx', contentType: DOCX });
  const track = (t: string) =>
    request(server()).post('/api/v1/public/applications/track').send({ token: t });
  const withdraw = (token: string) =>
    request(server()).post('/api/v1/public/applications/withdraw').send({ token });
  const tokenFor = async (to: string) => {
    for (let i = 0; i < 100; i++) {
      const mail = sent.find((m) => m.to === to);
      if (mail) return /applications\/track#t=([\w-]+)/.exec(mail.text)![1];
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`no email to ${to}`);
  };
  const applicationOf = (n: number) =>
    ds
      .getRepository(Application)
      .createQueryBuilder('a')
      .innerJoin('a.candidate', 'c')
      .where('c.email = :email', { email: emailOf(n) })
      .getOneOrFail();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    vi.spyOn(app.get<EmailProvider>(EMAIL_PROVIDER), 'send').mockImplementation(async (m) => {
      sent.push(m);
    });
    cv = await makeDocx([`Ứng viên ${run}`, '3 năm phát triển API bằng NestJS.']);
    const dep = await ds
      .getRepository(Department)
      .save(withOrg({ name: `Theo dõi ${run}`, code: `TD_${run}`.toUpperCase() }));
    depId = dep.id;
    const admin = await ds.getRepository(User).save(
      withOrg({
        email: adminEmail,
        fullName: 'Admin Theo Dõi',
        role: Role.Admin,
        passwordHash: await bcrypt.hash(password, 4),
      }),
    );
    const job = await ds.getRepository(Job).save(
      withOrg({
        title: `Backend theo dõi ${run}`,
        departmentId: dep.id,
        status: JobStatus.Open,
        location: 'Hà Nội',
        jdText: 'JD',
        jdVersion: 1,
        createdBy: admin.id,
        publishedAt: new Date(),
      }),
    );
    jobId = job.id;
    const login = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    const applications = await ds.getRepository(Application).findBy({ jobId });
    const candidateIds = applications.map((a) => a.candidateId);
    const files = await ds.getRepository(CvFile).findBy({ candidateId: In(candidateIds) });
    for (const f of files) await rm(join(process.cwd(), 'storage', f.storageKey), { force: true });
    await ds.getRepository(EmailOutbox).delete({ to: Like(`t-c%-${run}@%`) });
    await ds.getRepository(Application).delete({ jobId });
    await ds.getRepository(CvFile).delete({ candidateId: In(candidateIds) });
    await ds.getRepository(Candidate).delete({ id: In(candidateIds) });
    await ds.getRepository(Job).delete({ id: jobId });
    await ds.getRepository(User).delete({ email: adminEmail });
    await ds.getRepository(Department).delete({ id: depId });
    await app.close();
  });

  it('public apply emails a tracking link; the link shows only the reduced status', async () => {
    await apply(1).expect(201);
    const token = await tokenFor(emailOf(1));
    const mail = sent.find((m) => m.to === emailOf(1))!;
    expect(mail.subject).toContain(`Backend theo dõi ${run}`);

    const res = await track(token).expect(200);
    expect(res.body.data).toEqual({
      jobTitle: `Backend theo dõi ${run}`,
      companyName: expect.any(String),
      companySlug: expect.any(String),
      appliedAt: expect.any(String),
      stage: 'RECEIVED',
      withdrawable: true,
    });
    const row = await ds.getRepository(AuthToken).findOneByOrFail({
      applicationId: (await applicationOf(1)).id,
    });
    expect(row.kind).toBe(AuthTokenKind.TrackApplication);
    expect(row.tokenHash).not.toBe(token);
  });

  it('an unknown or expired token gets TOKEN_INVALID without saying why', async () => {
    const unknown = await track('x'.repeat(43)).expect(400);
    expect(unknown.body.code).toBe('TOKEN_INVALID');
    // SG-05 · R5: GET cũ (token trong query) đã gỡ; lỗi không echo query vào path
    const legacy = await request(server())
      .get('/api/v1/public/applications/track')
      .query({ t: 'x'.repeat(43) })
      .expect(404);
    expect(legacy.body.path).toBe('/api/v1/public/applications/track');
    expect(JSON.stringify(legacy.body)).not.toContain('xxxxxxxx');

    await apply(2).expect(201);
    const token = await tokenFor(emailOf(2));
    await ds
      .getRepository(AuthToken)
      .update(
        { applicationId: (await applicationOf(2)).id },
        { expiresAt: new Date(Date.now() - 1000) },
      );
    expect((await track(token).expect(400)).body.code).toBe('TOKEN_INVALID');
    expect((await withdraw(token).expect(400)).body.code).toBe('TOKEN_INVALID');
  });

  it('withdraw moves the application to WITHDRAWN once; the link still shows the result', async () => {
    const token = await tokenFor(emailOf(1));
    const res = await withdraw(token).expect(200);
    expect(res.body.data).toMatchObject({ stage: 'WITHDRAWN', withdrawable: false });

    const application = await applicationOf(1);
    expect(application.status).toBe(ApplicationStatus.Withdrawn);
    const history = await ds.getRepository(ApplicationStatusHistory).findOneByOrFail({
      applicationId: application.id,
      toStatus: ApplicationStatus.Withdrawn,
    });
    expect(history).toMatchObject({ changedBy: null, reason: WITHDRAW_REASON });
    const audit = await ds.getRepository(AuditLog).findOneByOrFail({
      entityId: application.id,
      action: AuditAction.ApplicationStatusChanged,
    });
    expect(audit).toMatchObject({ actorId: null, organizationId: application.organizationId });

    // W6
    expect((await applicationOf(2)).status).not.toBe(ApplicationStatus.Withdrawn);
    expect((await withdraw(token).expect(409)).body.code).toBe('APPLICATION_NOT_WITHDRAWABLE');
    expect((await track(token).expect(200)).body.data.stage).toBe('WITHDRAWN');
  });

  it('OFFER is shown as a decided result and cannot be withdrawn through the link', async () => {
    await apply(3).expect(201);
    const token = await tokenFor(emailOf(3));
    await ds
      .getRepository(Application)
      .update((await applicationOf(3)).id, { status: ApplicationStatus.Offer });
    expect((await track(token).expect(200)).body.data).toMatchObject({
      stage: 'DECIDED',
      withdrawable: false,
    });
    expect((await withdraw(token).expect(409)).body.code).toBe('APPLICATION_NOT_WITHDRAWABLE');
  });

  it('anonymizing the candidate kills the link and removes the tracking email', async () => {
    await apply(4).expect(201);
    const token = await tokenFor(emailOf(4));
    const application = await applicationOf(4);
    await request(server())
      .post(`/api/v1/candidates/${application.candidateId}/anonymize`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect((await track(token).expect(400)).body.code).toBe('TOKEN_INVALID');
    expect(
      await ds.getRepository(EmailOutbox).countBy({
        to: emailOf(4),
        template: EmailTemplate.ApplicationReceived,
      }),
    ).toBe(0);
  });

  it('HR upload does not email the candidate', async () => {
    await request(server())
      .post(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field({
        fullName: `HR Tải ${run}`,
        email: emailOf(5),
        consentConfirmed: 'true',
        phone: '0912345678',
      })
      .attach('cv', cv, { filename: 'cv.docx', contentType: DOCX })
      .expect(201);
    expect(await ds.getRepository(EmailOutbox).countBy({ to: emailOf(5) })).toBe(0);
    expect(
      await ds
        .getRepository(AuthToken)
        .countBy({ applicationId: In([(await applicationOf(5)).id]) }),
    ).toBe(0);
  });
});
