import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { EmailService } from '../email/email.service.js';
import { EmailTemplate } from '../email/email.types.js';
import { hashToken, RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import { User } from '../users/entities/user.entity.js';
import { AuthToken, AuthTokenKind } from './entities/auth-token.entity.js';

const SALT_ROUNDS = 10;
export const RESET_TOKEN_TTL_MS = 30 * 60_000;
export const RESET_PER_ACCOUNT_PER_HOUR = 3;

// SG-06 · R6 · BR-ACC-09
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthToken) private readonly tokens: Repository<AuthToken>,
    private readonly email: EmailService,
    private readonly refreshTokens: RefreshTokensService,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.users.findOneBy({ email });
    if (!user || !user.isActive) return;
    const recent = await this.tokens.countBy({
      userId: user.id,
      kind: AuthTokenKind.ResetPassword,
      createdAt: MoreThan(new Date(Date.now() - 3_600_000)),
    });
    if (recent >= RESET_PER_ACCOUNT_PER_HOUR) {
      this.logger.warn(`reset capped userHash=${this.hash(user.id)}`);
      return;
    }
    const token = randomBytes(32).toString('base64url');
    const outboxId = await this.dataSource.transaction(async (m) => {
      await m
        .createQueryBuilder()
        .update(AuthToken)
        .set({ usedAt: () => 'now()' })
        .where('user_id = :userId AND kind = :kind AND used_at IS NULL', {
          userId: user.id,
          kind: AuthTokenKind.ResetPassword,
        })
        .execute();
      await m.insert(AuthToken, {
        kind: AuthTokenKind.ResetPassword,
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });
      return this.email.enqueue(
        {
          organizationId: user.organizationId,
          to: user.email,
          template: EmailTemplate.ResetPassword,
          payload: { fullName: user.fullName, token },
        },
        m,
      );
    });
    await this.email.dispatch([outboxId]);
  }

  async reset(token: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await this.dataSource.transaction(async (m) => {
      const res = await m
        .createQueryBuilder()
        .update(AuthToken)
        .set({ usedAt: () => 'now()' })
        .where('token_hash = :hash AND kind = :kind', {
          hash: hashToken(token),
          kind: AuthTokenKind.ResetPassword,
        })
        .andWhere('used_at IS NULL AND expires_at > now()')
        .returning(['userId'])
        .execute();
      const id = (res.raw as { user_id: string }[])[0]?.user_id;
      if (!id) return null;
      await m.update(User, { id, isActive: true }, { passwordHash });
      return id;
    });
    if (!userId) {
      throw new BusinessException(
        ErrorCode.TokenInvalid,
        'Token is invalid or expired',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.refreshTokens.revokeAllForUser(userId);
    this.logger.log(`password reset userHash=${this.hash(userId)}`);
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
  }
}
