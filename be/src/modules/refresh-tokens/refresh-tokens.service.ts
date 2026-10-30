import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { IsNull, Not, Repository } from 'typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { jwtConfig } from '../../config/jwt.config.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';

export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export const TOKEN_PURGE_AFTER_DAYS = 30;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Backend Architecture 10.5
@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokensRepository: Repository<RefreshToken>,
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
    private readonly audit: AuditService,
  ) {}

  issue(userId: string, meta: SessionMeta = {}): Promise<string> {
    return this.insert(userId, randomUUID(), meta, this.tokensRepository);
  }

  async rotate(token: string, meta: SessionMeta = {}): Promise<{ userId: string; token: string }> {
    const current = await this.tokensRepository.findOneBy({ tokenHash: hashToken(token) });
    if (!current || current.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (current.revokedAt) {
      await this.revokeFamily(current.familyId);
      await this.recordReuse(current, meta);
      throw this.reused();
    }

    const next = await this.tokensRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(RefreshToken);
      const { affected } = await repo.update(
        { id: current.id, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      if (!affected) return null;
      return this.insert(current.userId, current.familyId, meta, repo);
    });

    if (!next) {
      await this.revokeFamily(current.familyId);
      await this.recordReuse(current, meta);
      throw this.reused();
    }
    return { userId: current.userId, token: next };
  }

  async revokeFamilyOf(token: string): Promise<void> {
    const current = await this.tokensRepository.findOneBy({ tokenHash: hashToken(token) });
    if (current) await this.revokeFamily(current.familyId);
  }

  async revokeAllForUser(userId: string, keepToken?: string): Promise<void> {
    const keep = keepToken
      ? await this.tokensRepository.findOneBy({ tokenHash: hashToken(keepToken), userId })
      : null;
    await this.tokensRepository.update(
      {
        userId,
        revokedAt: IsNull(),
        ...(keep && { familyId: Not(keep.familyId) }),
      },
      { revokedAt: new Date() },
    );
  }

  // F-OPS-03, Database Design 6
  async purgeExpired(): Promise<number> {
    const result = await this.tokensRepository
      .createQueryBuilder()
      .delete()
      .where(`expires_at < now() - make_interval(days => :days)`, { days: TOKEN_PURGE_AFTER_DAYS })
      .execute();
    return result.affected ?? 0;
  }

  // BR-AUDIT-01, OWASP A09: refresh token đã thu hồi bị dùng lại
  private recordReuse(token: RefreshToken, meta: SessionMeta) {
    return this.audit.recordSafely({
      actorId: null,
      action: AuditAction.TokenReuseDetected,
      entity: AuditEntity.User,
      entityId: token.userId,
      metadata: { familyId: token.familyId, userAgent: meta.userAgent?.slice(0, 200) ?? null },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.tokensRepository.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async insert(
    userId: string,
    familyId: string,
    meta: SessionMeta,
    repo: Repository<RefreshToken>,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await repo.insert({
      userId,
      familyId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + this.config.refreshExpiresIn * 1000),
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ip: meta.ip ?? null,
    });
    return token;
  }

  private reused() {
    return new BusinessException(
      ErrorCode.RefreshTokenReused,
      'Refresh token reused',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
