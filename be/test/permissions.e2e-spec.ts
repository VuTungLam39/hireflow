import { INestApplication, Type } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import {
  AUTHENTICATED_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from '../src/common/constants/index.js';
import { Role } from '../src/common/enums/role.enum.js';
import { ROLE_PERMISSIONS } from '../src/common/permissions/role-permissions.js';
import { Department } from '../src/modules/departments/entities/department.entity.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { setupApp } from '../src/setup-app.js';

describe('Permissions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const run = randomUUID().slice(0, 8);
  const password = 'Password123';
  const code = `PERM_${run}`.toUpperCase();
  const emails = {
    admin: `p-admin-${run}@example.com`,
    hr: `p-hr-${run}@example.com`,
    hm: `p-hm-${run}@example.com`,
  };
  const tokens: Record<keyof typeof emails, string> = { admin: '', hr: '', hm: '' };
  let hrId = '';

  const server = () => app.getHttpServer();
  const as = (role: keyof typeof emails, req: request.Test) =>
    req.set('Authorization', `Bearer ${tokens[role]}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    dataSource = app.get(DataSource);

    const department = await dataSource
      .getRepository(Department)
      .save({ name: `Phòng quyền ${run}`, code });
    const passwordHash = await bcrypt.hash(password, 4);
    const users = dataSource.getRepository(User);
    const [, hr] = await users.save([
      users.create({ email: emails.admin, fullName: 'P Admin', role: Role.Admin, passwordHash }),
      users.create({ email: emails.hr, fullName: 'P HR', role: Role.Hr, passwordHash }),
      users.create({
        email: emails.hm,
        fullName: 'P HM',
        role: Role.HiringManager,
        departmentId: department.id,
        passwordHash,
      }),
    ]);
    hrId = hr.id;

    for (const role of Object.keys(emails) as (keyof typeof emails)[]) {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: emails[role], password })
        .expect(200);
      tokens[role] = res.body.data.tokens.accessToken;
    }
  });

  afterAll(async () => {
    await dataSource.getRepository(User).delete({ email: In(Object.values(emails)) });
    await dataSource.getRepository(Department).delete({ code: In([code, `${code}_NEW`]) });
    await app.close();
  });

  // Backend Architecture 16.2
  it('every route declares @Public, @Authenticated or @Permissions', () => {
    const reflector = app.get(Reflector);
    const missing: string[] = [];
    let checked = 0;

    for (const { metatype } of app.get(DiscoveryService).getControllers()) {
      if (!metatype) continue;
      const controller = metatype as Type;
      const proto = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const handler = proto[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        if (!Reflect.hasMetadata(PATH_METADATA, handler)) continue;
        checked++;
        const declared = [IS_PUBLIC_KEY, AUTHENTICATED_KEY, PERMISSIONS_KEY].some((key) =>
          reflector.getAllAndOverride(key, [handler, controller]),
        );
        if (!declared) missing.push(`${controller.name}.${name}`);
      }
    }

    expect(checked).toBeGreaterThan(10);
    expect(missing).toEqual([]);
  });

  it.each([
    ['admin', Role.Admin],
    ['hr', Role.Hr],
    ['hm', Role.HiringManager],
  ] as const)('GET /auth/me returns the permissions of %s', async (key, role) => {
    const res = await as(key, request(server()).get('/api/v1/auth/me')).expect(200);
    expect([...res.body.data.permissions].sort()).toEqual([...ROLE_PERMISSIONS[role]].sort());
  });

  describe('matrix (API Contract 3)', () => {
    it.each([
      ['admin', 200],
      ['hr', 403],
      ['hm', 403],
    ] as const)('GET /users as %s → %i', async (role, status) => {
      await as(role, request(server()).get('/api/v1/users')).expect(status);
    });

    it.each([
      ['hr', 403],
      ['hm', 403],
    ] as const)('PATCH /users/:id/status as %s → %i', async (role, status) => {
      await as(role, request(server()).patch(`/api/v1/users/${hrId}/status`))
        .send({ isActive: false })
        .expect(status);
    });

    it.each(['admin', 'hr', 'hm'] as const)('GET /departments as %s → 200', async (role) => {
      await as(role, request(server()).get('/api/v1/departments')).expect(200);
    });

    it.each([
      ['hr', 403],
      ['hm', 403],
      ['admin', 201],
    ] as const)('POST /departments as %s → %i', async (role, status) => {
      const res = await as(role, request(server()).post('/api/v1/departments'))
        .send({ name: `Phòng mới ${run}`, code: `${code}_NEW` })
        .expect(status);
      if (status === 403) expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
