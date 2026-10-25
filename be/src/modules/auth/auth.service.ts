import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const safeEqual = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    // Dùng chung 1 thông báo lỗi để không lộ email nào đã tồn tại
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // BR-ACC-04: tài khoản bị khoá trả 403 (API Contract 4.1), khác với sai mật khẩu (401)
    if (!user.isActive) {
      throw new BusinessException(
        ErrorCode.AccountDisabled,
        'Account is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user);
    return { user: await this.usersService.findById(user.id), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    const valid =
      !!user?.refreshTokenHash && safeEqual(hashToken(refreshToken), user.refreshTokenHash);
    if (!user || !valid || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Rotation: mỗi lần refresh sẽ cấp refresh token mới, token cũ hết hiệu lực
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.accessSecret,
        expiresIn: this.config.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.refreshSecret,
        expiresIn: this.config.refreshExpiresIn,
        jwtid: randomUUID(),
      }),
    ]);

    // Chỉ lưu hash của refresh token trong DB. Không dùng bcrypt vì bcrypt chỉ đọc
    // 72 byte đầu, mà các JWT của cùng 1 user có phần đầu gần như giống nhau.
    await this.usersService.updateRefreshTokenHash(user.id, hashToken(refreshToken));

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.accessExpiresIn,
    };
  }
}
