import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In, Like } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { AuthToken } from '../src/modules/auth/entities/auth-token.entity.js';
import {
  EMAIL_PROVIDER,
  type EmailMessage,
  type EmailProvider,
} from '../src/modules/email/email.types.js';
import { EmailOutbox, EmailStatus } from '../src/modules/email/entities/email-outbox.entity.js';
import {
  Organization,
  OrganizationStatus,
} from '../src/modules/organizations/entities/organization.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// MVP 3 · US-19, BR-ACC-09, BR-ORG-05, BR-NOTI-02
describe('Employer registration (e2e)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const digits = String(Date.now()).slice(-8);
  const taxCode = (n: number) => `${n}${digits}${n}`.slice(0, 10);
  const password = 'Password123';
  const sent: EmailMessage[] = [];
  let ipSeq = 0;
  const previousTrustProxy = process.env.TRUST_PROXY;

  const server = () => app.getHttpServer();
  const nextIp = () => `198.51.100.${++ipSeq}`;
  const post = (path: string, body: object, ip = nextIp()) =>
    request(server()).post(`/api/v1${path}`).set('X-Forwarded-For', ip).send(body);
  const form = (n: number, extra: object = {}) => ({
    companyName: `Công ty Đăng Ký ${run} ${n}`,
    taxCode: taxCode(n),
    website: 'https://example.com',
    fullName: 'Nguyễn Văn Đăng',
    email: `reg-${n}-${run}@example.com`,
    password,
    acceptTerms: true,
    ...extra,
  });
  const mailTo = async (to: string, count = 1): Promise<EmailMessage[]> => {
    for (let i = 0; i < 100; i++) {
      const mails = sent.filter((m) => m.to === to);
      if (mails.length >= count) return mails;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`no email to ${to}`);
  };
  const tokenIn = (mail: EmailMessage) => /verify-email\?t=([\w-]+)/.exec(mail.text)![1];
  const login = (email: string) => post('/auth/login', { email, password });

  beforeAll(async () => {
    process.env.TRUST_PROXY = '1';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);
    vi.spyOn(app.get<EmailProvider>(EMAIL_PROVIDER), 'send').mockImplementation(async (m) => {
      sent.push(m);
    });
  });

  afterAll(async () => {
    process.env.TRUST_PROXY = previousTrustProxy;
    const orgs = await ds.getRepository(Organization).findBy({ name: Like(`%${run}%`) });
    const orgIds = orgs.map((o) => o.id);
    const emails = Array.from({ length: 10 }, (_, n) => `reg-${n}-${run}@example.com`);
    await ds.getRepository(EmailOutbox).delete({ to: In(emails) });
    if (orgIds.length) {
      await ds.getRepository(User).delete({ organizationId: In(orgIds) });
      await ds.getRepository(Organization).delete({ id: In(orgIds) });
    }
    await ds.getRepository(User).delete({ email: In(emails) });
    await app.close();
  });

  it('register → verify by email → sign in as Admin of a PENDING company (US-19)', async () => {
    const dto = form(1);
    await post('/public/employers/register', dto).expect(202);

    const org = await ds.getRepository(Organization).findOneByOrFail({ taxCode: dto.taxCode });
    expect(org).toMatchObject({ status: OrganizationStatus.Pending, website: dto.website });
    expect(org.slug).toBe(`cong-ty-dang-ky-${run}-1`);
    const user = await ds
      .getRepository(User)
      .findOneByOrFail({ email: dto.email, organizationId: org.id });
    expect(user).toMatchObject({ role: Role.Admin, emailVerifiedAt: null, departmentId: null });

    const wrong = await login(dto.email).expect(403);
    expect(wrong.body.code).toBe('EMAIL_NOT_VERIFIED');
    await post('/auth/login', { email: dto.email, password: 'Wrong-pass1' }).expect(401);

    const [mail] = await mailTo(dto.email);
    expect(mail.text).toContain('Đây là bản demo HireFlow');
    const token = tokenIn(mail);
    expect(
      await ds.getRepository(AuthToken).existsBy({ tokenHash: token }),
      'only the hash is stored',
    ).toBe(false);

    await post('/public/employers/verify-email', { token }).expect(200);
    const reused = await post('/public/employers/verify-email', { token }).expect(400);
    expect(reused.body.code).toBe('TOKEN_INVALID');

    const ok = await login(dto.email).expect(200);
    const me = await request(server())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${ok.body.data.tokens.accessToken}`)
      .expect(200);
    expect(me.body.data).toMatchObject({
      role: Role.Admin,
      organization: { id: org.id, slug: org.slug, status: OrganizationStatus.Pending },
    });

    const outbox = await ds.getRepository(EmailOutbox).findOneByOrFail({ to: dto.email });
    expect(outbox.status).toBe(EmailStatus.Sent);
    expect(outbox.payload).not.toHaveProperty('token');
  });

  it('BR-ORG-05: a tax code registers once; the same company name gets the next slug', async () => {
    await post('/public/employers/register', form(2)).expect(202);
    const again = await post('/public/employers/register', form(3, { taxCode: taxCode(2) })).expect(
      409,
    );
    expect(again.body.code).toBe('ORGANIZATION_EXISTS');

    await post('/public/employers/register', form(4, { companyName: form(2).companyName })).expect(
      202,
    );
    const org = await ds.getRepository(Organization).findOneByOrFail({ taxCode: taxCode(4) });
    expect(org.slug).toBe(`cong-ty-dang-ky-${run}-2-2`);
  });

  it('BR-ACC-09: an email that already has an account still gets 202 and a different email', async () => {
    const res = await post(
      '/public/employers/register',
      form(5, { email: `reg-1-${run}@example.com` }),
    );
    expect(res.status).toBe(202);
    expect(await ds.getRepository(Organization).existsBy({ taxCode: taxCode(5) })).toBe(false);
    const mails = await mailTo(`reg-1-${run}@example.com`, 2);
    expect(mails.at(-1)!.subject).toContain('đã có tài khoản');
    expect(mails.at(-1)!.text).not.toContain('verify-email');
  });

  it('BR-ACC-09: resending replaces the link; unknown or verified emails get the same 202 silently', async () => {
    const dto = form(6);
    await post('/public/employers/register', dto).expect(202);
    const [first] = await mailTo(dto.email);

    await post('/public/employers/resend-verification', { email: dto.email }).expect(202);
    const second = (await mailTo(dto.email, 2))[1];
    const old = await post('/public/employers/verify-email', { token: tokenIn(first) }).expect(400);
    expect(old.body.code).toBe('TOKEN_INVALID');
    await post('/public/employers/verify-email', { token: tokenIn(second) }).expect(200);

    const before = sent.length;
    await post('/public/employers/resend-verification', { email: dto.email }).expect(202);
    await post('/public/employers/resend-verification', {
      email: `nobody-${run}@example.com`,
    }).expect(202);
    await new Promise((r) => setTimeout(r, 300));
    expect(sent.length).toBe(before);
  });

  it('BR-ACC-09: an expired link is refused', async () => {
    const dto = form(7);
    await post('/public/employers/register', dto).expect(202);
    const token = tokenIn((await mailTo(dto.email))[0]);
    const user = await ds.getRepository(User).findOneByOrFail({ email: dto.email });
    await ds
      .getRepository(AuthToken)
      .update({ userId: user.id }, { expiresAt: new Date(Date.now() - 1000) });
    const res = await post('/public/employers/verify-email', { token }).expect(400);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('validates the form: tax code, https website, terms, password', async () => {
    const bad = [
      { taxCode: '12345' },
      { website: 'http://example.com' },
      { acceptTerms: false },
      { password: 'short' },
      { companyName: 'A\u0000B' },
    ];
    for (const extra of bad) {
      const res = await post('/public/employers/register', form(8, extra));
      expect(res.status, JSON.stringify(extra)).toBe(400);
    }
    expect(await ds.getRepository(Organization).existsBy({ taxCode: taxCode(8) })).toBe(false);
  });

  it('allows 3 registrations per hour per IP (BR-ACC-09)', async () => {
    const ip = nextIp();
    for (let i = 0; i < 3; i++) {
      await post('/public/employers/register', { acceptTerms: false }, ip).expect(400);
    }
    await post('/public/employers/register', form(9), ip).expect(429);
  });
});
