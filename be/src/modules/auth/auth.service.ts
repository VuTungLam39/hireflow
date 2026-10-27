import { HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import { type Permission, ROLE_PERMISSIONS } from '../../common/permissions/index.js';
import { jwtConfig } from '../../config/jwt.config.js';
import {
  RefreshTokensService,
  type SessionMeta,
} from '../refresh-tokens/refresh-tokens.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async login(dto: LoginDto, meta: SessionMeta): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.loginFailed(dto.email, user ? 'wrong_password' : 'unknown_email', meta);
      throw new UnauthorizedException('Invalid email or password');
    }
    // BR-ACC-04
    if (!user.isActive) {
      this.loginFailed(dto.email, 'account_disabled', meta);
      throw new BusinessException(
        ErrorCode.AccountDisabled,
        'Account is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.usersService.updateLastLogin(user.id);
    const refreshToken = await this.refreshTokensService.issue(user.id, meta);
    return {
      user: await this.usersService.findById(user.id),
      tokens: await this.withAccessToken(user, refreshToken),
    };
  }

  async refresh(refreshToken: string, meta: SessionMeta): Promise<AuthTokens> {
    const rotated = await this.refreshTokensService.rotate(refreshToken, meta);
    const user = await this.usersService.findById(rotated.userId).catch(() => null);
    if (!user?.isActive) {
      await this.refreshTokensService.revokeAllForUser(rotated.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.withAccessToken(user, rotated.token);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.refreshTokensService.revokeFamilyOf(refreshToken);
  }

  async me(userId: string): Promise<User & { permissions: readonly Permission[] }> {
    const user = await this.usersService.findById(userId);
    return Object.assign(user, { permissions: ROLE_PERMISSIONS[user.role] });
  }

  // BR-ACC-06
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentRefreshToken: string | undefined,
  ): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BusinessException(
        ErrorCode.WrongPassword,
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
        [{ field: 'currentPassword', messages: ['Mật khẩu hiện tại không đúng'] }],
      );
    }
    await this.usersService.setPassword(userId, dto.newPassword);
    await this.refreshTokensService.revokeAllForUser(userId, currentRefreshToken);
  }

  // OWASP A09: ghi log JSON, email băm để không lộ dữ liệu cá nhân
  private loginFailed(email: string, reason: string, meta: SessionMeta) {
    const emailHash = createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex')
      .slice(0, 16);
    this.logger.warn(`login failed reason=${reason} emailHash=${emailHash} ip=${meta.ip ?? '-'}`);
  }

  private async withAccessToken(user: User, refreshToken: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.config.accessSecret,
        expiresIn: this.config.accessExpiresIn,
      }),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.accessExpiresIn,
    };
  }
}
