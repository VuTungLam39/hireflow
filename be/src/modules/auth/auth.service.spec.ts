import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum.js';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { Permission } from '../../common/permissions/index.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;

  const users = {
    findByEmailWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    findById: vi.fn(),
    setPassword: vi.fn(),
    updateLastLogin: vi.fn(),
  };
  const tokens = {
    issue: vi.fn(async () => 'refresh-1'),
    rotate: vi.fn(),
    revokeFamilyOf: vi.fn(),
    revokeAllForUser: vi.fn(),
  };
  const hr = { id: 'u-1', email: 'hr@x.dev', role: Role.Hr, isActive: true };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Password123', 4);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    users.findById.mockResolvedValue({ ...hr });
    users.findByIdWithPassword.mockResolvedValue({ ...hr, passwordHash });
    users.findByEmailWithPassword.mockResolvedValue({ ...hr, passwordHash });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: RefreshTokensService, useValue: tokens },
        { provide: JwtService, useValue: { signAsync: vi.fn(async () => 'access-1') } },
        {
          provide: jwtConfig.KEY,
          useValue: { accessSecret: 's'.repeat(32), accessExpiresIn: 900, refreshExpiresIn: 60 },
        },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('login opens a new refresh token chain', async () => {
    const result = await service.login(
      { email: hr.email, password: 'Password123' },
      { userAgent: 'vitest', ip: '127.0.0.1' },
    );
    expect(tokens.issue).toHaveBeenCalledWith('u-1', { userAgent: 'vitest', ip: '127.0.0.1' });
    expect(result.tokens).toMatchObject({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });

  it('refresh revokes everything when the user was disabled meanwhile', async () => {
    tokens.rotate.mockResolvedValue({ userId: 'u-1', token: 'refresh-2' });
    users.findById.mockResolvedValue({ ...hr, isActive: false });
    await expect(service.refresh('refresh-1', {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u-1');
  });

  it('me returns the permissions of the role', async () => {
    const me = await service.me('u-1');
    expect(me.permissions).toContain(Permission.ApplicationCreate);
    expect(me.permissions).not.toContain(Permission.UserManage);
  });

  describe('changePassword (BR-ACC-06)', () => {
    it('rejects a wrong current password with WRONG_PASSWORD on that field', async () => {
      const error = (await service
        .changePassword('u-1', { currentPassword: 'Nope12345', newPassword: 'NewPass123' }, 'rt')
        .catch((e: unknown) => e)) as BusinessException;
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.getResponse()).toMatchObject({
        code: ErrorCode.WrongPassword,
        errors: [{ field: 'currentPassword' }],
      });
      expect(users.setPassword).not.toHaveBeenCalled();
    });

    it('saves the new password and revokes every other session', async () => {
      await service.changePassword(
        'u-1',
        { currentPassword: 'Password123', newPassword: 'NewPass123' },
        'current-rt',
      );
      expect(users.setPassword).toHaveBeenCalledWith('u-1', 'NewPass123');
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u-1', 'current-rt');
    });
  });
});
