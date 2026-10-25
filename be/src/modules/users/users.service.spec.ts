import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    existsBy: vi.fn(),
    create: vi.fn((dto) => dto),
    save: vi.fn(async (user) => ({ id: 'uuid-1', ...user })),
    findOneBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('hashes the password when creating a user', async () => {
    repo.existsBy.mockResolvedValue(false);

    const user = await service.create({
      email: 'a@b.com',
      password: 'Password123',
      fullName: 'A B',
    });

    expect(user.password).not.toBe('Password123');
    expect(await bcrypt.compare('Password123', user.password)).toBe(true);
  });

  it('rejects a duplicate email with 409 EMAIL_EXISTS on the email field (BR-ACC-02)', async () => {
    repo.existsBy.mockResolvedValue(true);
    const error = await service
      .create({ email: 'a@b.com', password: 'Password123', fullName: 'A B' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BusinessException);
    expect((error as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
    expect((error as BusinessException).getResponse()).toMatchObject({
      code: ErrorCode.EmailExists,
      errors: [{ field: 'email' }],
    });
  });

  it('throws NotFoundException when user does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
