import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { AuthToken, AuthTokenKind } from '../src/modules/auth/entities/auth-token.entity.js';
import {
  EMAIL_PROVIDER,
  type EmailMessage,
  type EmailProvider,
} from '../src/modules/email/email.types.js';
import { EmailOutbox } from '../src/modules/email/entities/email-outbox.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';
import { withOrg } from './fixtures.js';

// SG-06 · R6 · BR-ACC-09
describe('Password reset (e2e)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const fresh = 'NewPassword456';
  const sent: EmailMessage[] = [];
  let ipSeq = 0;
  const previousTrustProxy = process.env.TRUST_PROXY;
  const emailOf = (n: number) => `reset-${n}-${run}@example.com`;

  const server = () => app.getHttpServer();
  const post = (path: string, body: object) =>
    request(server())
      .post(`/api/v1${path}`)
      .set('X-Forwarded-For', `198.51.101.${++ipSeq}`)
      .send(body);
  const mailsTo = (to: string) => sent.filter((m) => m.to === to);
  const waitMails = async (to: string, count: number) => {
    for (let i = 0; i < 100; i++) {
      if (mailsTo(to).length >= count) return mailsTo(to);
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`expected ${count} email(s) to ${to}, got ${mailsTo(to).length}`);
  };
  const tokenIn = (mail: EmailMessage) => /reset-password#t=([\w-]+)/.exec(mail.text)![1];
  const cookieOf = (res: request.Response) =>
    ([] as string[])
      .concat((res.headers['set-cookie'] as unknown as string[] | string | undefined) ?? [])
      .find((c) => c.startsWith('refresh_token='))!
      .split(';')[0];

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
    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(User).save(
      [1, 2, 3, 4].map((n) =>
        withOrg({
          email: emailOf(n),
          fullName: `Người dùng ${n}`,
          role: Role.Hr,
          passwordHash,
          isActive: n !== 4,
        }),
      ),
    );
  });

  afterAll(async () => {
    process.env.TRUST_PROXY = previousTrustProxy;
    const emails = [1, 2, 3, 4].map(emailOf);
    await ds.getRepository(EmailOutbox).delete({ to: In(emails) });
    await ds.getRepository(User).delete({ email: In(emails) });
    await app.close();
  });

  it('answers 202 the same way for an unknown email and an inactive account, and sends nothing', async () => {
    const unknown = await post('/auth/forgot-password', {
      email: `nobody-${run}@example.com`,
    }).expect(202);
    const inactive = await post('/auth/forgot-password', { email: emailOf(4) }).expect(202);
    expect(inactive.body.message).toBe(unknown.body.message);
    await new Promise((r) => setTimeout(r, 300));
    expect(mailsTo(`nobody-${run}@example.com`)).toHaveLength(0);
    expect(mailsTo(emailOf(4))).toHaveLength(0);
  });

  it('emails a one-time link in the URL fragment; reset changes the password and ends every session', async () => {
    const session = cookieOf(
      await post('/auth/login', { email: emailOf(1), password }).expect(200),
    );
    await post('/auth/forgot-password', { email: ` ${emailOf(1).toUpperCase()} ` }).expect(202);
    const [mail] = await waitMails(emailOf(1), 1);
    expect(mail.text).toContain('/reset-password#t=');
    expect(mail.text).not.toContain('reset-password?t=');
    const token = tokenIn(mail);

    const weak = await post('/auth/reset-password', { token, password: 'short' }).expect(400);
    expect(weak.body.errors).toEqual([expect.objectContaining({ field: 'password' })]);

    await post('/auth/reset-password', { token, password: fresh }).expect(200);
    await post('/auth/login', { email: emailOf(1), password }).expect(401);
    await post('/auth/login', { email: emailOf(1), password: fresh }).expect(200);
    await request(server()).post('/api/v1/auth/refresh').set('Cookie', session).expect(401);

    const reused = await post('/auth/reset-password', { token, password: 'Another789A' }).expect(
      400,
    );
    expect(reused.body.code).toBe('TOKEN_INVALID');
  });

  it('a new link cancels the previous one, and an expired link is refused', async () => {
    await post('/auth/forgot-password', { email: emailOf(2) }).expect(202);
    const first = tokenIn((await waitMails(emailOf(2), 1))[0]);
    await post('/auth/forgot-password', { email: emailOf(2) }).expect(202);
    const second = tokenIn((await waitMails(emailOf(2), 2))[1]);

    expect(
      (await post('/auth/reset-password', { token: first, password: fresh }).expect(400)).body.code,
    ).toBe('TOKEN_INVALID');

    const user = await ds.getRepository(User).findOneByOrFail({ email: emailOf(2) });
    await ds
      .getRepository(AuthToken)
      .update(
        { userId: user.id, kind: AuthTokenKind.ResetPassword },
        { expiresAt: new Date(Date.now() - 1000) },
      );
    expect(
      (await post('/auth/reset-password', { token: second, password: fresh }).expect(400)).body
        .code,
    ).toBe('TOKEN_INVALID');
  });

  it('sends at most 3 links per account per hour, still answering 202', async () => {
    for (let i = 0; i < 4; i++)
      await post('/auth/forgot-password', { email: emailOf(3) }).expect(202);
    await waitMails(emailOf(3), 3);
    await new Promise((r) => setTimeout(r, 400));
    expect(mailsTo(emailOf(3))).toHaveLength(3);
  });

  it('limits forgot-password to 3 requests per hour from one IP', async () => {
    const ip = `198.51.102.${run.charCodeAt(0) % 250}`;
    const call = () =>
      request(server())
        .post('/api/v1/auth/forgot-password')
        .set('X-Forwarded-For', ip)
        .send({ email: `nobody-${run}@example.com` });
    for (let i = 0; i < 3; i++) await call().expect(202);
    await call().expect(429);
  });
});
