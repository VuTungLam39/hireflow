import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { DepartmentsService } from '../departments/departments.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

const DEPT = '7b0c9a52-3f1e-4d2a-9c11-0a1b2c3d4e5f';

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
    createQueryBuilder: vi.fn(() => queryBuilder(() => stored)),
  };
  const departments = { exists: vi.fn() };

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
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('hashes the password', async () => {
      const user = await service.create(dto());
      expect(user.passwordHash).not.toBe('Password123');
      expect(await bcrypt.compare('Password123', user.passwordHash)).toBe(true);
    });

    it('rejects a duplicate email with 409 EMAIL_EXISTS on the email field (BR-ACC-02)', async () => {
      repo.existsBy.mockResolvedValue(true);
      const error = await errorOf(service.create(dto()));
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(error.getResponse()).toMatchObject({
        code: ErrorCode.EmailExists,
        errors: [{ field: 'email' }],
      });
    });

    it.each([Role.Admin, Role.Hr])('drops departmentId for %s (BR-ACC-03)', async (role) => {
      const user = await service.create(dto({ role, departmentId: DEPT }));
      expect(user.departmentId).toBeNull();
      expect(departments.exists).not.toHaveBeenCalled();
    });

    it('keeps the department of a hiring manager', async () => {
      const user = await service.create(dto({ role: Role.HiringManager, departmentId: DEPT }));
      expect(user.departmentId).toBe(DEPT);
    });

    it('requires a department for a hiring manager (BR-ACC-03)', async () => {
      const error = await errorOf(service.create(dto({ role: Role.HiringManager })));
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
        service.create(dto({ role: Role.HiringManager, departmentId: DEPT })),
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
        email: 'hm@b.com',
        role: Role.HiringManager,
        departmentId: DEPT,
        department: { id: DEPT, name: 'Kỹ thuật' } as User['department'],
      };
    });

    it('clears the department when a hiring manager becomes HR', async () => {
      const user = await service.update('u-1', { role: Role.Hr });
      expect(user).toMatchObject({ role: Role.Hr, departmentId: null });
    });

    it('keeps the current department when only the name changes', async () => {
      const user = await service.update('u-1', { fullName: 'Tên mới' });
      expect(user).toMatchObject({ fullName: 'Tên mới', departmentId: DEPT });
    });

    it('rejects removing the department of a hiring manager', async () => {
      const error = await errorOf(service.update('u-1', { departmentId: null }));
      expect(error.getResponse()).toMatchObject({ errors: [{ field: 'departmentId' }] });
    });

    it('re-hashes a new password', async () => {
      const user = await service.update('u-1', { password: 'NewPass123' });
      expect(await bcrypt.compare('NewPass123', user.passwordHash)).toBe(true);
    });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
