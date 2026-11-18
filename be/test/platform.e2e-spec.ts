import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity.js';
import {
  EMAIL_PROVIDER,
  type EmailMessage,
  type EmailProvider,
} from '../src/modules/email/email.types.js';
import { EmailOutbox } from '../src/modules/email/entities/email-outbox.entity.js';
import {
  Organization,
  OrganizationStatus,
} from '../src/modules/organizations/entities/organization.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

// MVP 3 · US-20, BR-ORG-04, BR-TEN-04, KH 8.2
describe('Platform admin (e2e)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const orgP = randomUUID();
  const orgQ = randomUUID();
  const orgC = randomUUID();
  const emails = {
    platform: `pf-root-${run}@example.com`,
    company: `pf-admin-${run}@example.com`,
    p: `pf-p-${run}@example.com`,
    q: `pf-q-${run}@example.com`,
  };
  const tokens: Record<keyof typeof emails, string> = { platform: '', company: '', p: '', q: '' };
  const sent: EmailMessage[] = [];

  const server = () => app.getHttpServer();
  const as = (who: keyof typeof tokens, req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens[who]}`);
  const signIn = (email: string) =>
    request(server()).post('/api/v1/auth/login').send({ email, password });
  const mailTo = async (to: string, subject: string) => {
    for (let i = 0; i < 100; i++) {
      const mail = sent.find((m) => m.to === to && m.subject.includes(subject));
      if (mail) return mail;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`no "${subject}" email to ${to}`);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    vi.spyOn(app.get<EmailProvider>(EMAIL_PROVIDER), 'send').mockImplementation(async (m) => {
      sent.push(m);
    });

    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(Organization).insert([
      { id: orgP, name: `Công ty P ${run}`, slug: `pf-p-${run}`, taxCode: `9${run}`.slice(0, 10) },
      { id: orgQ, name: `Công ty Q ${run}`, slug: `pf-q-${run}`, taxCode: `8${run}`.slice(0, 10) },
      {
        id: orgC,
        name: `Công ty C ${run}`,
        slug: `pf-c-${run}`,
        status: OrganizationStatus.Active,
      },
    ]);
    await ds.getRepository(User).save([
      {
        email: emails.platform,
        fullName: 'Quản trị sàn',
        role: Role.PlatformAdmin,
        organizationId: null,
        passwordHash,
      },
      withOrg(
        {
          email: emails.company,
          fullName: 'Admin C',
          role: Role.Admin,
          passwordHash,
        },
        orgC,
      ),
      withOrg({ email: emails.p, fullName: 'Admin P', role: Role.Admin, passwordHash }, orgP),
      withOrg({ email: emails.q, fullName: 'Admin Q', role: Role.Admin, passwordHash }, orgQ),
    ]);
    for (const who of Object.keys(emails) as (keyof typeof emails)[]) {
      const res = await signIn(emails[who]).expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await ds.getRepository(EmailOutbox).delete({ organizationId: In([orgP, orgQ, orgC]) });
    await ds.getRepository(AuditLog).delete({ organizationId: In([orgP, orgQ]) });
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Organization).delete({ id: In([orgP, orgQ, orgC]) });
    await app.close();
  });

  it('a company Admin cannot reach the platform endpoints (platform:manage trap)', async () => {
    await as('company', request(server()).get('/api/v1/platform/organizations')).expect(403);
    await as('company', request(server()).get(`/api/v1/platform/organizations/${orgP}`)).expect(
      403,
    );
    await as('company', request(server()).patch(`/api/v1/platform/organizations/${orgP}/approve`))
      .send({})
      .expect(403);
    await as('company', request(server()).get('/api/v1/platform/queues')).expect(403);
  });

  it('BR-ACC-01: a company Admin cannot create a platform admin', async () => {
    const res = await as('company', request(server()).post('/api/v1/users')).send({
      email: `pf-sneaky-${run}@example.com`,
      password,
      fullName: 'Sneaky',
      role: Role.PlatformAdmin,
    });
    expect(res.status).toBe(400);
    expect(await ds.getRepository(User).existsBy({ email: `pf-sneaky-${run}@example.com` })).toBe(
      false,
    );
  });

  it('BR-TEN-04: the platform admin reads no recruiting data', async () => {
    const me = await as('platform', request(server()).get('/api/v1/auth/me')).expect(200);
    expect(me.body.data).toMatchObject({ role: Role.PlatformAdmin, organization: null });
    expect(me.body.data.permissions).toEqual(['platform:manage']);
    for (const path of [
      '/jobs',
      '/applications',
      '/candidates',
      '/users',
      '/departments',
      '/audit-logs',
      '/dashboard/summary',
      '/admin/jobs/failed',
    ]) {
      const res = await as('platform', request(server()).get(`/api/v1${path}`));
      expect(res.status, path).toBe(403);
    }
  });

  it('lists companies by status with counts, and shows one company', async () => {
    const res = await as(
      'platform',
      request(server()).get(`/api/v1/platform/organizations?status=PENDING&search=${run}`),
    ).expect(200);
    const p = (res.body.data as { id: string }[]).find((o) => o.id === orgP);
    expect(p).toMatchObject({
      name: `Công ty P ${run}`,
      status: OrganizationStatus.Pending,
      adminEmail: emails.p,
      userCount: 1,
      openJobs: 0,
      applications30d: 0,
    });
    expect(res.body.meta.totalItems).toBe(2);
    const one = await as(
      'platform',
      request(server()).get(`/api/v1/platform/organizations/${orgQ}`),
    ).expect(200);
    expect(one.body.data.adminEmail).toBe(emails.q);
    await as(
      'platform',
      request(server()).get(`/api/v1/platform/organizations/${randomUUID()}`),
    ).expect(404);
  });

  it('approve: PENDING → ACTIVE, emails the company, writes the audit log, refuses a second time', async () => {
    const res = await as(
      'platform',
      request(server()).patch(`/api/v1/platform/organizations/${orgP}/approve`),
    ).expect(200);
    expect(res.body.data.status).toBe(OrganizationStatus.Active);
    const org = await ds.getRepository(Organization).findOneByOrFail({ id: orgP });
    expect(org.approvedAt).not.toBeNull();
    expect(org.approvedBy).toBeTruthy();
    await mailTo(emails.p, 'đã được duyệt');
    expect(
      await ds
        .getRepository(AuditLog)
        .findOneByOrFail({ organizationId: orgP, action: 'ORG_APPROVED' as never }),
    ).toMatchObject({ entity: 'organization', entityId: orgP });

    const again = await as(
      'platform',
      request(server()).patch(`/api/v1/platform/organizations/${orgP}/approve`),
    ).expect(409);
    expect(again.body.code).toBe('INVALID_ORG_TRANSITION');
  });

  it('reject needs a reason, and a rejected company cannot sign in', async () => {
    await as('platform', request(server()).patch(`/api/v1/platform/organizations/${orgQ}/reject`))
      .send({ reason: 'ok' })
      .expect(400);
    await as('platform', request(server()).patch(`/api/v1/platform/organizations/${orgQ}/reject`))
      .send({ reason: 'Mã số thuế không khớp' })
      .expect(200);
    const mail = await mailTo(emails.q, 'chưa được duyệt');
    expect(mail.text).toContain('Mã số thuế không khớp');
    const login = await signIn(emails.q).expect(403);
    expect(login.body.code).toBe('ORG_DISABLED');
    await as('q', request(server()).get('/api/v1/auth/me')).expect(403);
  });

  it('suspend cuts open sessions on the next request; reactivate lets them back (BR-ORG-04)', async () => {
    await as('p', request(server()).get('/api/v1/users')).expect(200);
    await as('platform', request(server()).patch(`/api/v1/platform/organizations/${orgP}/suspend`))
      .send({ reason: 'Vi phạm điều khoản sàn' })
      .expect(200);
    const blocked = await as('p', request(server()).get('/api/v1/users')).expect(403);
    expect(blocked.body.code).toBe('ORG_DISABLED');
    await mailTo(emails.p, 'tạm khoá');

    await as('platform', request(server()).patch(`/api/v1/platform/organizations/${orgP}/suspend`))
      .send({ reason: 'Lần hai' })
      .expect(409);
    await as(
      'platform',
      request(server()).patch(`/api/v1/platform/organizations/${orgP}/reactivate`),
    ).expect(200);
    await as('p', request(server()).get('/api/v1/users')).expect(200);
    const org = await ds.getRepository(Organization).findOneByOrFail({ id: orgP });
    expect(org).toMatchObject({ status: OrganizationStatus.Active, statusReason: null });
  });

  it('KH 8.2: queue counts moved to the platform admin', async () => {
    const res = await as('platform', request(server()).get('/api/v1/platform/queues')).expect(200);
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
