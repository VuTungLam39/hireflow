import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

// Kickoff 16 · BR-AI-10
describe('Rate limit (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const emails = { a: `rl-a-${run}@example.com`, b: `rl-b-${run}@example.com` };
  const tokens = { a: '', b: '' };
  const departmentCode = `RL_${run}`.toUpperCase();
  let ipSeq = 0;
  const nextIp = () => `203.0.113.${++ipSeq}`;
  const previousTrustProxy = process.env.TRUST_PROXY;

  const server = () => app.getHttpServer();
  const login = (email: string, pass: string, ip: string) =>
    request(server())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password: pass });
  const chat = (who: keyof typeof tokens, ip: string) =>
    request(server())
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${tokens[who]}`)
      .set('X-Forwarded-For', ip)
      .send({ question: 'Ai biết Kafka?' });

  beforeAll(async () => {
    process.env.TRUST_PROXY = '1';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    ds = app.get(DataSource);

    const dep = await ds
      .getRepository(Department)
      .save({ name: `Rate limit ${run}`, code: departmentCode });
    const passwordHash = await bcrypt.hash(password, 4);
    await ds.getRepository(User).save(
      Object.values(emails).map((email) => ({
        email,
        fullName: 'Rate Limit HM',
        role: Role.HiringManager,
        departmentId: dep.id,
        passwordHash,
      })),
    );
    for (const who of ['a', 'b'] as const) {
      const res = await login(emails[who], password, nextIp()).expect(200);
      tokens[who] = res.body.data.tokens.accessToken;
    }
  }, 30_000);

  afterAll(async () => {
    await ds.getRepository(User).delete({ email: In(Object.values(emails)) });
    await ds.getRepository(Department).delete({ code: departmentCode });
    await app.close();
    if (previousTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previousTrustProxy;
  });

  it('Kickoff 16: login is limited to 5 tries a minute per account, even across IPs', async () => {
    const target = `rl-target-${run}@example.com`;
    for (let i = 0; i < 5; i++) await login(target, 'Wrong123', nextIp()).expect(401);
    const res = await login(target, 'Wrong123', nextIp()).expect(429);
    expect(res.body.code).toBe('TOO_MANY_REQUESTS');
  });

  it('Kickoff 16: login is still limited to 5 tries a minute per IP', async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      await login(`rl-ip-${i}-${run}@example.com`, 'Wrong123', ip).expect(401);
    }
    await login(`rl-ip-5-${run}@example.com`, 'Wrong123', ip).expect(429);
  });

  it('BR-AI-10: chat allows 20 questions a minute per user, not per IP', async () => {
    const sharedIp = nextIp();
    for (let i = 0; i < 20; i++) await chat('a', sharedIp).expect(200);
    const blocked = await chat('a', sharedIp).expect(429);
    expect(blocked.body.code).toBe('TOO_MANY_REQUESTS');
    await chat('b', sharedIp).expect(200);
  }, 30_000);
});
