import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BusinessException, ErrorCode } from '../../common/exceptions/index.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { AiUsageKind } from './entities/ai-usage.entity.js';

const VN_OFFSET_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;
export const LIMIT_CACHE_MS = 60_000;

// BR-AI-11: ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè)
export const vnDay = (at: Date = new Date()) =>
  new Date(at.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

export const nextVnMidnight = (at: Date = new Date()) =>
  new Date(Math.floor((at.getTime() + VN_OFFSET_MS) / DAY_MS + 1) * DAY_MS - VN_OFFSET_MS);

export interface AiUsageDay {
  day: string;
  cv: number;
  chat: number;
}

interface Limits {
  [AiUsageKind.Cv]: number;
  [AiUsageKind.Chat]: number;
  expiresAt: number;
}

// MVP 3 · BR-AI-11
@Injectable()
export class AiQuotaService {
  private readonly limits = new Map<string, Limits>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Lấy một lượt; hết hạn mức thì trả lại lượt vừa lấy và trả false */
  async consume(organizationId: string, kind: AiUsageKind, at = new Date()): Promise<boolean> {
    const limit = (await this.limitsOf(organizationId))[kind];
    const day = vnDay(at);
    const [row] = await this.dataSource.query<{ count: number }[]>(
      `INSERT INTO ai_usage (organization_id, day, kind, count) VALUES ($1, $2, $3, 1)
       ON CONFLICT (organization_id, day, kind) DO UPDATE SET count = ai_usage.count + 1
       RETURNING count`,
      [organizationId, day, kind],
    );
    if (row.count <= limit) return true;
    await this.dataSource.query(
      `UPDATE ai_usage SET count = count - 1 WHERE organization_id = $1 AND day = $2 AND kind = $3 AND count > 0`,
      [organizationId, day, kind],
    );
    return false;
  }

  async consumeChat(organizationId: string): Promise<void> {
    if (await this.consume(organizationId, AiUsageKind.Chat)) return;
    throw new BusinessException(
      ErrorCode.AiQuotaExceeded,
      'Daily AI quota of the organization is used up',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async usage(organizationId: string, days = 7, at = new Date()): Promise<AiUsageDay[]> {
    const dates = Array.from({ length: days }, (_, i) =>
      vnDay(new Date(at.getTime() - i * DAY_MS)),
    );
    const rows = await this.dataSource.query<{ day: string; kind: AiUsageKind; count: number }[]>(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, kind, count FROM ai_usage
       WHERE organization_id = $1 AND day >= $2::date`,
      [organizationId, dates[dates.length - 1]],
    );
    const pick = (day: string, kind: AiUsageKind) =>
      rows.find((r) => r.day === day && r.kind === kind)?.count ?? 0;
    return dates.map((day) => ({
      day,
      cv: pick(day, AiUsageKind.Cv),
      chat: pick(day, AiUsageKind.Chat),
    }));
  }

  // Quản trị sàn vừa sửa hạn mức: tiến trình này áp dụng ngay, tiến trình khác chậm tối đa 60 giây
  invalidate(organizationId: string): void {
    this.limits.delete(organizationId);
  }

  private async limitsOf(organizationId: string): Promise<Limits> {
    const cached = this.limits.get(organizationId);
    if (cached && cached.expiresAt > Date.now()) return cached;
    const org = await this.dataSource.getRepository(Organization).findOneOrFail({
      select: { id: true, aiDailyScoreLimit: true, aiDailyChatLimit: true },
      where: { id: organizationId },
    });
    const limits: Limits = {
      [AiUsageKind.Cv]: org.aiDailyScoreLimit,
      [AiUsageKind.Chat]: org.aiDailyChatLimit,
      expiresAt: Date.now() + LIMIT_CACHE_MS,
    };
    this.limits.set(organizationId, limits);
    return limits;
  }
}
