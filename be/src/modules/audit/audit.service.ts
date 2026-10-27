import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { currentRequest } from '../../common/context/request-context.js';
import { CursorResult } from '../../common/dto/cursor-result.dto.js';
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.js';
import { User } from '../users/entities/user.entity.js';
import { QueryAuditLogDto } from './dto/query-audit-log.dto.js';
import {
  AuditAction,
  AuditEntity,
  AuditLog,
  type AuditMetadata,
} from './entities/audit-log.entity.js';

export interface AuditEntry {
  actorId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  metadata?: AuditMetadata;
}

export interface AuditLogView {
  id: string;
  actorId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  metadata: AuditMetadata;
  ip: string | null;
  requestId: string | null;
  createdAt: Date;
  actor: { id: string; fullName: string; email: string } | null;
}

// F-AUDIT-01, FR-AUDIT
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async record(entry: AuditEntry, manager?: EntityManager): Promise<void> {
    const { ip, requestId } = currentRequest();
    const row = {
      ...entry,
      metadata: entry.metadata ?? {},
      ip: ip ?? null,
      requestId: requestId ?? null,
    };
    if (manager) {
      await manager.insert(AuditLog, row);
      return;
    }
    await this.repo.insert(row);
  }

  async recordSafely(entry: AuditEntry): Promise<void> {
    await this.record(entry).catch((error: Error) =>
      this.logger.error(`audit ${entry.action} ${entry.entityId}: ${error.message}`),
    );
  }

  async list(query: QueryAuditLogDto): Promise<CursorResult<AuditLogView>> {
    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoin(User, 'actor', 'actor.id = log.actorId')
      .select('log')
      .addSelect(['actor.id', 'actor.fullName', 'actor.email'])
      .orderBy('log.createdAt', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .limit(query.limit + 1);
    if (query.action) qb.andWhere('log.action = :action', { action: query.action });
    if (query.entity) qb.andWhere('log.entity = :entity', { entity: query.entity });
    if (query.entityId) qb.andWhere('log.entityId = :entityId', { entityId: query.entityId });
    if (query.actorId) qb.andWhere('log.actorId = :actorId', { actorId: query.actorId });
    if (query.from) qb.andWhere('log.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('log.createdAt < :to', { to: query.to });
    if (query.cursor) {
      const { createdAt, id } = decodeCursor(query.cursor);
      qb.andWhere('(log.createdAt, log.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: createdAt,
        cursorId: id,
      });
    }

    const { entities, raw } = await qb.getRawAndEntities<{
      log_id: string;
      actor_id: string | null;
      actor_full_name: string | null;
      actor_email: string | null;
    }>();
    const actors = new Map(
      raw
        .filter((r) => r.actor_id)
        .map((r) => [
          r.log_id,
          { id: r.actor_id!, fullName: r.actor_full_name!, email: r.actor_email! },
        ]),
    );
    const page = entities.slice(0, query.limit);
    const last = page.at(-1);
    return new CursorResult(
      page.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        metadata: log.metadata,
        ip: log.ip,
        requestId: log.requestId,
        createdAt: log.createdAt,
        actor: actors.get(log.id) ?? null,
      })),
      query.limit,
      entities.length > query.limit && last ? encodeCursor(last) : null,
    );
  }
}
