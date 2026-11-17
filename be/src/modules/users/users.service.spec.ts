import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { DepartmentsService } from '../departments/departments.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

const DEPT = '7b0c9a52-3f1e-4d2a-9c11-0a1b2c3d4e5f';
const ORG = 'org-1';
const ADMIN = { id: 'admin-1', organizationId: ORG };
const self = (id: string) => ({ id, organizationId: ORG });

const queryBuilder = (result: () => unknown) => {
  const qb: Record<string, unknown> = {};
  for (const m of ['leftJoin', 'addSelect', 'where', 'andWhere', 'orderBy', 'skip', 'take']) {
    qb[m] = vi.fn(() => qb);
  }
  qb.getOne = vi.fn(async () => result());
  return qb;
};

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected rejection');
    },
    (e: unknown) => e as BusinessException,
  );

describe('UsersService', () => {
  let service: UsersService;
  let stored: Partial<User> | null;

  const repo = {
    existsBy: vi.fn(),
    create: vi.fn((data: Partial<User>) => ({ ...data })),
    save: vi.fn(async (user: Partial<User>) => {
      stored = { id: user.id ?? 'uuid-1', ...user };
      return stored;
    }),
    softDelete: vi.fn(),
    update: vi.fn(async (_id: string, patch: Partial<User>) => {
      stored = { ...stored, ...patch };
    }),
    createQueryBuilder: vi.fn(() => queryBuilder(() => stored)),
  };
  const departments = { exists: vi.fn() };
  const refreshTokens = { revokeAllForUser: vi.fn() };
  const audit = { record: vi.fn() };

  const dto = (patch: Partial<CreateUserDto> = {}): CreateUserDto => ({
    email: 'a@b.com',
    password: 'Password123',
    fullName: 'A B',
    role: Role.Hr,
    ...patch,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    stored = null;
    repo.existsBy.mockResolvedValue(false);
    departments.exists.mockResolvedValue(true);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: DepartmentsService, useValue: departments },
        { provide: RefreshTokensService, useValue: refreshTokens },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('hashes the password', async () => {
      const user = await service.create(dto(), ADMIN);
      expect(user.passwordHash).not.toBe('Password123');
      expect(await bcrypt.compare('Password123', user.passwordHash)).toBe(true);
    });

    it('rejects a duplicate email with 409 EMAIL_EXISTS on the email field (BR-ACC-02)', async () => {
      repo.existsBy.mockResolvedValue(true);
      const error = await errorOf(service.create(dto(), ADMIN));
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(error.getResponse()).toMatchObject({
        code: ErrorCode.EmailExists,
        errors: [{ field: 'email' }],
      });
    });

    it.each([Role.Admin, Role.Hr])('drops departmentId for %s (BR-ACC-03)', async (role) => {
      const user = await service.create(dto({ role, departmentId: DEPT }), ADMIN);
      expect(user.departmentId).toBeNull();
      expect(departments.exists).not.toHaveBeenCalled();
    });

    it('keeps the department of a hiring manager', async () => {
      const user = await service.create(
        dto({ role: Role.HiringManager, departmentId: DEPT }),
        ADMIN,
      );
      expect(user.departmentId).toBe(DEPT);
    });

    it('requires a department for a hiring manager (BR-ACC-03)', async () => {
      const error = await errorOf(service.create(dto({ role: Role.HiringManager }), ADMIN));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toMatchObject({
        code: ErrorCode.ValidationFailed,
        errors: [{ field: 'departmentId' }],
      });
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown department', async () => {
      departments.exists.mockResolvedValue(false);
      const error = await errorOf(
        service.create(dto({ role: Role.HiringManager, departmentId: DEPT }), ADMIN),
      );
      expect(error.getResponse()).toMatchObject({
        errors: [{ field: 'departmentId', messages: ['Phòng ban không tồn tại'] }],
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      stored = {
        id: 'u-1',
        organizationId: ORG,
        email: 'hm@b.com',
        role: Role.HiringManager,
        departmentId: DEPT,
        department: { id: DEPT, name: 'Kỹ thuật' } as User['department'],
      };
    });

    it('clears the department when a hiring manager becomes HR', async () => {
      const user = await service.update('u-1', { role: Role.Hr }, ADMIN);
      expect(user).toMatchObject({ role: Role.Hr, departmentId: null });
      expect(audit.record).toHaveBeenCalledWith({
        organizationId: ORG,
        actorId: 'admin-1',
        action: 'USER_UPDATED',
        entity: 'user',
        entityId: 'u-1',
        metadata: {
          roleFrom: Role.HiringManager,
          roleTo: Role.Hr,
          departmentFrom: DEPT,
          departmentTo: null,
        },
      });
    });

    it('hides a user of another organization (BR-TEN-02)', async () => {
      await expect(
        service.update('u-1', { fullName: 'X' }, { id: 'admin-9', organizationId: 'org-2' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('keeps the current department when only the name changes', async () => {
      const user = await service.update('u-1', { fullName: 'Tên mới' }, ADMIN);
      expect(user).toMatchObject({ fullName: 'Tên mới', departmentId: DEPT });
      expect(audit.record).not.toHaveBeenCalled();
    });

    it('rejects removing the department of a hiring manager', async () => {
      const error = await errorOf(service.update('u-1', { departmentId: null }, ADMIN));
      expect(error.getResponse()).toMatchObject({ errors: [{ field: 'departmentId' }] });
    });

    it('re-hashes a new password and signs the user out everywhere (BR-ACC-06)', async () => {
      const user = await service.update('u-1', { password: 'NewPass123' }, ADMIN);
      expect(await bcrypt.compare('NewPass123', user.passwordHash)).toBe(true);
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u-1');
    });

    it('keeps sessions when the password is not changed', async () => {
      await service.update('u-1', { fullName: 'Tên mới' }, ADMIN);
      expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('BR-ACC-05: does not let an admin change their own role', async () => {
      stored = {
        id: 'admin-1',
        organizationId: ORG,
        email: 'a@b.com',
        role: Role.Admin,
        departmentId: null,
      };
      const error = await errorOf(service.update('admin-1', { role: Role.Hr }, ADMIN));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.code).toBe(ErrorCode.ValidationFailed);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('BR-ACC-05: lets an admin edit their own profile when the role stays the same', async () => {
      stored = {
        id: 'admin-1',
        organizationId: ORG,
        email: 'a@b.com',
        role: Role.Admin,
        departmentId: null,
      };
      const user = await service.update(
        'admin-1',
        { role: Role.Admin, fullName: 'Tên mới' },
        ADMIN,
      );
      expect(user).toMatchObject({ role: Role.Admin, fullName: 'Tên mới' });
    });
  });

  describe('setStatus (BR-ACC-04, BR-ACC-05)', () => {
    beforeEach(() => {
      stored = { id: 'u-1', organizationId: ORG, role: Role.Hr, isActive: true };
    });

    it('disables the account and revokes every refresh token', async () => {
      const user = await service.setStatus('u-1', false, ADMIN);
      expect(user.isActive).toBe(false);
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u-1');
    });

    it('re-enables without touching sessions', async () => {
      await service.setStatus('u-1', true, ADMIN);
      expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('does not let an admin disable themself', async () => {
      const error = await errorOf(service.setStatus('u-1', false, self('u-1')));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.code).toBe(ErrorCode.ValidationFailed);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove (BR-ACC-05)', () => {
    beforeEach(() => {
      stored = { id: 'u-1', organizationId: ORG, role: Role.Hr };
    });

    it('soft-deletes and revokes sessions', async () => {
      await service.remove('u-1', ADMIN);
      expect(repo.softDelete).toHaveBeenCalledWith('u-1');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u-1');
    });

    it('does not let an admin delete themself', async () => {
      const error = await errorOf(service.remove('u-1', self('u-1')));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
