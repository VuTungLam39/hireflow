import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
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

  it('throws ConflictException when email already exists', async () => {
    repo.existsBy.mockResolvedValue(true);
    await expect(
      service.create({ email: 'a@b.com', password: 'Password123', fullName: 'A B' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when user does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
