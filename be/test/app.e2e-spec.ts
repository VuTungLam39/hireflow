import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Role } from '../src/common/enums/role.enum.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { RefreshTokensService } from '../src/modules/refresh-tokens/refresh-tokens.service.js';
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
  const lockEmail = `e2e-lock-${run}@example.com`;
  const departmentCode = `E2E_${run}`.toUpperCase();
  let departmentId = '';
  let adminToken = '';
  let hrToken = '';
  let hrCookie = '';

  const server = () => app.getHttpServer();
  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
  const asHr = (req: request.Test) => req.set('Authorization', `Bearer ${hrToken}`);
  const refresh = (cookie: string) =>
    request(server()).post('/api/v1/auth/refresh').set('Cookie', cookie);
  const sessionOf = async (email: string) => {
    const user = await dataSource.getRepository(User).findOneByOrFail({ email });
    return `refresh_token=${await app.get(RefreshTokensService).issue(user.id)}`;
  };
  const userId = async (email: string) =>
    (await dataSource.getRepository(User).findOneByOrFail({ email })).id;

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
      users.create({ email: lockEmail, fullName: 'E2E Lock', role: Role.Hr, passwordHash }),
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
    await dataSource
      .getRepository(User)
      .delete({ email: In([adminEmail, hrEmail, hmEmail, lockEmail]) });
    await dataSource.getRepository(Department).delete({ code: departmentCode });
    await app.close();
  });

  it('GET /api/health', async () => {
    const res = await request(server()).get('/api/health').expect(200);
    expect(res.body.data.status).toBe('ok');
    expect(Object.keys(res.body.data.info).sort()).toEqual(['database', 'redis', 'storage']);
    expect(res.body.data.info.storage).toMatchObject({ status: 'up', driver: 'local' });
  });

  describe('auth', () => {
    it('sets a safe refresh cookie and rotates it', async () => {
      expect(hrCookie).toMatch(/HttpOnly/i);
      expect(hrCookie).toMatch(/SameSite=Strict/i);
      expect(hrCookie).toMatch(/Path=\/api\/v1\/auth/i);

      const refreshed = await refresh(hrCookie).expect(200);
      expect(refreshed.body.data.accessToken).toBeTruthy();
      expect(refreshed.body.data.refreshToken).toBeUndefined();
      const next = refreshCookieOf(refreshed);
      expect(next).not.toBe(hrCookie);
      expect((await refresh(next).expect(200)).body.data.accessToken).toBeTruthy();
    });

    it('reusing an old refresh token revokes the whole chain (BE-06)', async () => {
      const first = await sessionOf(hrEmail);
      const second = refreshCookieOf(await refresh(first).expect(200));

      const reused = await refresh(first).expect(401);
      expect(reused.body.code).toBe('REFRESH_TOKEN_REUSED');
      expect(refreshCookieOf(reused)).toMatch(/refresh_token=;/);

      const after = await refresh(second).expect(401);
      expect(after.body.code).toBe('REFRESH_TOKEN_REUSED');
    });

    it('rejects a missing or unknown refresh token with 401 UNAUTHORIZED', async () => {
      const missing = await request(server()).post('/api/v1/auth/refresh').expect(401);
      expect(missing.body.code).toBe('UNAUTHORIZED');
      const unknown = await refresh('refresh_token=made-up').expect(401);
      expect(unknown.body.code).toBe('UNAUTHORIZED');
    });

    it('logout revokes the current chain only', async () => {
      const current = await sessionOf(hrEmail);
      const other = await sessionOf(hrEmail);
      const res = await asHr(request(server()).post('/api/v1/auth/logout'))
        .set('Cookie', current)
        .expect(200);
      expect(refreshCookieOf(res)).toMatch(/refresh_token=;/);
      await refresh(current).expect(401);
      await refresh(other).expect(200);
    });

    it('GET /auth/me returns role and department', async () => {
      const res = await asHr(request(server()).get('/api/v1/auth/me')).expect(200);
      expect(res.body.data).toMatchObject({
        email: hrEmail,
        role: 'hr',
        departmentId: null,
        department: null,
      });
      expect(res.body.data.permissions).toEqual(expect.arrayContaining(['application:create']));
      expect(res.body.data.permissions).not.toContain('user:manage');
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

    it('changes the password and signs out other sessions (BR-ACC-06)', async () => {
      const current = await sessionOf(hrEmail);
      const other = await sessionOf(hrEmail);
      const change = (body: object) =>
        asHr(request(server()).patch('/api/v1/auth/password')).set('Cookie', current).send(body);

      const wrong = await change({ currentPassword: 'Wrong12345', newPassword: 'NewPass123' });
      expect(wrong.status).toBe(400);
      expect(wrong.body.code).toBe('WRONG_PASSWORD');
      expect(wrong.body.errors).toEqual([expect.objectContaining({ field: 'currentPassword' })]);

      const weak = await change({ currentPassword: password, newPassword: 'weak' });
      expect(weak.status).toBe(400);
      expect(weak.body.code).toBe('VALIDATION_FAILED');

      await change({ currentPassword: password, newPassword: 'NewPass123' }).expect(200);
      await refresh(current).expect(200);
      await refresh(other).expect(401);

      const saved = await dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: hrEmail })
        .getOneOrFail();
      expect(await bcrypt.compare('NewPass123', saved.passwordHash)).toBe(true);
    });

    it('requires a token for protected routes', async () => {
      const res = await request(server()).get('/api/v1/users').expect(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('account status (BE-07)', () => {
    it('locking revokes sessions and blocks login; unlocking allows it again (BR-ACC-04)', async () => {
      const id = await userId(lockEmail);
      const session = await sessionOf(lockEmail);

      const locked = await asAdmin(request(server()).patch(`/api/v1/users/${id}/status`))
        .send({ isActive: false })
        .expect(200);
      expect(locked.body.data.isActive).toBe(false);
      await refresh(session).expect(401);

      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: lockEmail, password })
        .expect(403);
      expect(login.body.code).toBe('ACCOUNT_DISABLED');

      const unlocked = await asAdmin(request(server()).patch(`/api/v1/users/${id}/status`))
        .send({ isActive: true })
        .expect(200);
      expect(unlocked.body.data.isActive).toBe(true);
    });

    it('isActive is only changed through /status', async () => {
      const id = await userId(lockEmail);
      const res = await asAdmin(request(server()).patch(`/api/v1/users/${id}`))
        .send({ isActive: false })
        .expect(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'isActive' })]);
    });

    it('an admin cannot disable or delete themself (BR-ACC-05)', async () => {
      const id = await userId(adminEmail);
      const lockSelf = await asAdmin(request(server()).patch(`/api/v1/users/${id}/status`))
        .send({ isActive: false })
        .expect(400);
      expect(lockSelf.body.code).toBe('VALIDATION_FAILED');
      await asAdmin(request(server()).delete(`/api/v1/users/${id}`)).expect(400);
    });

    it('non-admin cannot change account status', async () => {
      const id = await userId(lockEmail);
      await asHr(request(server()).patch(`/api/v1/users/${id}/status`))
        .send({ isActive: false })
        .expect(403);
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
