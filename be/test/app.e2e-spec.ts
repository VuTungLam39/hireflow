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

function refreshCookieOf(res: request.Response): string {
  const raw = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const found = list.find((c) => c.startsWith('refresh_token='));
  if (!found) throw new Error('Missing refresh_token cookie');
  return found;
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const adminEmail = `e2e-admin-${run}@example.com`;
  const hrEmail = `e2e-hr-${run}@example.com`;
  const hmEmail = `e2e-hm-${run}@example.com`;
  const departmentCode = `E2E_${run}`.toUpperCase();
  let departmentId = '';
  let adminToken = '';
  let hrToken = '';
  let hrCookie = '';

  const server = () => app.getHttpServer();
  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
  const asHr = (req: request.Test) => req.set('Authorization', `Bearer ${hrToken}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    dataSource = app.get(DataSource);

    const passwordHash = await bcrypt.hash(password, 10);
    const users = dataSource.getRepository(User);
    await users.save([
      users.create({ email: adminEmail, fullName: 'E2E Admin', role: Role.Admin, passwordHash }),
      users.create({ email: hrEmail, fullName: 'E2E HR', role: Role.Hr, passwordHash }),
    ]);

    const admin = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = admin.body.data.tokens.accessToken;

    const hr = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: hrEmail, password })
      .expect(200);
    hrToken = hr.body.data.tokens.accessToken;
    hrCookie = refreshCookieOf(hr);
    expect(hr.body.data.user.passwordHash).toBeUndefined();
    expect(hr.body.data.tokens.refreshToken).toBeUndefined();
  });

  afterAll(async () => {
    await dataSource.getRepository(User).delete({ email: In([adminEmail, hrEmail, hmEmail]) });
    await dataSource.getRepository(Department).delete({ code: departmentCode });
    await app.close();
  });

  it('GET /api/health', async () => {
    const res = await request(server()).get('/api/health').expect(200);
    expect(res.body.data.status).toBe('ok');
  });

  describe('auth', () => {
    it('sets a safe refresh cookie and rotates it', async () => {
      expect(hrCookie).toMatch(/HttpOnly/i);
      expect(hrCookie).toMatch(/SameSite=Strict/i);
      expect(hrCookie).toMatch(/Path=\/api\/v1\/auth/i);

      const refreshed = await request(server())
        .post('/api/v1/auth/refresh')
        .set('Cookie', hrCookie)
        .expect(200);
      expect(refreshed.body.data.accessToken).toBeTruthy();
      expect(refreshCookieOf(refreshed)).not.toBe(hrCookie);

      await request(server()).post('/api/v1/auth/refresh').set('Cookie', hrCookie).expect(401);
      await request(server()).post('/api/v1/auth/refresh').expect(401);
    });

    it('GET /auth/me returns role and department', async () => {
      const res = await asHr(request(server()).get('/api/v1/auth/me')).expect(200);
      expect(res.body.data).toMatchObject({
        email: hrEmail,
        role: 'hr',
        departmentId: null,
        department: null,
      });
    });

    it('has no self-registration (BR-ACC-01)', async () => {
      const res = await request(server())
        .post('/api/v1/auth/register')
        .send({ email: `x-${run}@example.com`, password, fullName: 'X' })
        .expect(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('rejects a wrong password with 401 UNAUTHORIZED', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: hrEmail, password: 'Wrong12345' })
        .expect(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects a disabled account with 403 ACCOUNT_DISABLED (BR-ACC-04)', async () => {
      const users = dataSource.getRepository(User);
      await users.update({ email: hrEmail }, { isActive: false });
      try {
        const res = await request(server())
          .post('/api/v1/auth/login')
          .send({ email: hrEmail, password })
          .expect(403);
        expect(res.body.code).toBe('ACCOUNT_DISABLED');
      } finally {
        await users.update({ email: hrEmail }, { isActive: true });
      }
    });

    it('requires a token for protected routes', async () => {
      const res = await request(server()).get('/api/v1/users').expect(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('departments (BE-05)', () => {
    it('admin creates a department; code is upper-cased', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/departments'))
        .send({ name: `Phòng E2E ${run}`, code: departmentCode.toLowerCase() })
        .expect(201);
      expect(res.body.data).toMatchObject({ code: departmentCode, userCount: 0, jobCount: 0 });
      departmentId = res.body.data.id;
    });

    it('rejects a duplicate code with 409 CONFLICT on the code field', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/departments'))
        .send({ name: `Khác ${run}`, code: departmentCode })
        .expect(409);
      expect(res.body.code).toBe('CONFLICT');
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'code' })]);
    });

    it('rejects an invalid code with 400 VALIDATION_FAILED', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/departments'))
        .send({ name: 'Sai mã', code: 'có dấu' })
        .expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'code' })]);
    });

    it('any signed-in user can list departments; only admin can write', async () => {
      const list = await asHr(
        request(server()).get(`/api/v1/departments?search=${departmentCode}`),
      ).expect(200);
      expect(list.body.data).toEqual([expect.objectContaining({ id: departmentId })]);
      expect(list.body.meta).toMatchObject({ page: 1, totalItems: 1 });

      const res = await asHr(request(server()).post('/api/v1/departments'))
        .send({ name: 'HR tạo', code: 'HR_TRY' })
        .expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('users with role and department (BE-04)', () => {
    it('blocks non-admin from /users', async () => {
      const res = await asHr(request(server()).get('/api/v1/users')).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('requires a department for a hiring manager (BR-ACC-03)', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/users'))
        .send({ email: hmEmail, password, fullName: 'E2E HM', role: 'hiring_manager' })
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'departmentId' })]);
    });

    it('creates a hiring manager with a department', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/users'))
        .send({
          email: hmEmail,
          password,
          fullName: 'E2E HM',
          role: 'hiring_manager',
          departmentId,
        })
        .expect(201);
      expect(res.body.data).toMatchObject({
        role: 'hiring_manager',
        departmentId,
        department: { id: departmentId, name: `Phòng E2E ${run}` },
      });
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('rejects a duplicate email with 409 EMAIL_EXISTS', async () => {
      const res = await asAdmin(request(server()).post('/api/v1/users'))
        .send({ email: hmEmail, password, fullName: 'Trùng', role: 'hr' })
        .expect(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('counts users and blocks deleting a department in use (BR-ACC-08)', async () => {
      const list = await asAdmin(
        request(server()).get(`/api/v1/departments?search=${departmentCode}`),
      ).expect(200);
      expect(list.body.data[0].userCount).toBe(1);

      const res = await asAdmin(
        request(server()).delete(`/api/v1/departments/${departmentId}`),
      ).expect(409);
      expect(res.body.code).toBe('DEPARTMENT_IN_USE');
    });

    it('moving the hiring manager to HR clears the department, then the department can be deleted', async () => {
      const hm = await dataSource.getRepository(User).findOneByOrFail({ email: hmEmail });
      const res = await asAdmin(request(server()).patch(`/api/v1/users/${hm.id}`))
        .send({ role: 'hr' })
        .expect(200);
      expect(res.body.data).toMatchObject({ role: 'hr', departmentId: null, department: null });

      await asAdmin(request(server()).delete(`/api/v1/departments/${departmentId}`)).expect(200);
    });
  });
});
