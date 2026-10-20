import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

/**
 * E2E test chạy với database thật được cấu hình trong .env
 * (cần chạy `npm run db:up` và `npm run migration:run` trước).
 */
/** Lấy header Set-Cookie của refresh token (dạng "refresh_token=...; Path=...; HttpOnly") */
function refreshCookieOf(res: request.Response): string {
  const raw = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const found = list.find((c) => c.startsWith('refresh_token='));
  if (!found) throw new Error('Missing refresh_token cookie');
  return found;
}

describe('App (e2e)', () => {
  let app: INestApplication;
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'Password123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    // Dọn dữ liệu test
    await app.get(DataSource).getRepository(User).delete({ email });
    await app.close();
  });

  it('GET /api/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('rejects invalid register payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
    );
  });

  it('register -> me -> refresh -> logout', async () => {
    const server = app.getHttpServer();

    const register = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'E2E User' })
      .expect(201);
    expect(register.body.data.user.password).toBeUndefined();
    const { accessToken } = register.body.data.tokens;
    // Refresh token không được nằm trong body, chỉ nằm trong cookie httpOnly
    expect(register.body.data.tokens.refreshToken).toBeUndefined();
    const cookie = refreshCookieOf(register);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/i);

    const me = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data.email).toBe(email);

    const refreshed = await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    expect(refreshed.body.data.refreshToken).toBeUndefined();
    const newCookie = refreshCookieOf(refreshed);
    expect(newCookie).not.toBe(cookie);

    // Cookie cũ không dùng lại được (rotation)
    await request(server).post('/api/v1/auth/refresh').set('Cookie', cookie).expect(401);
    // Thiếu cookie
    await request(server).post('/api/v1/auth/refresh').expect(401);

    const logout = await request(server)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    // Đăng xuất xoá cookie
    expect(refreshCookieOf(logout)).toMatch(/refresh_token=;/);
  });

  it('blocks non-admin from /users', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
      .expect(403);
  });

  it('requires a token for protected routes', () =>
    request(app.getHttpServer()).get('/api/v1/users').expect(401));
});
