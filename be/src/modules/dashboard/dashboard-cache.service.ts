import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { AppEvents } from '../../common/events/app-events.js';
import { REDIS, RedisClients } from '../../common/redis/redis.module.js';

export const DASHBOARD_CACHE_TTL_SECONDS = 60;

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

// Kickoff 14: dashboard cache Redis (MVP 2)
@Injectable()
export class DashboardCache implements OnModuleInit {
  private readonly logger = new Logger(DashboardCache.name);
  private readonly versionKey: string;
  readonly stats: CacheStats = { hits: 0, misses: 0, errors: 0 };

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    clients: RedisClients,
    private readonly events: AppEvents,
  ) {
    this.versionKey = `${clients.prefix}dashboard:version`;
  }

  onModuleInit(): void {
    this.events.on('application.changed', () => this.invalidate());
    this.events.on('job.changed', () => this.invalidate());
  }

  async getOrCompute<T>(scope: string, compute: () => Promise<T>): Promise<T> {
    let key: string | null = null;
    try {
      const version = (await this.redis.get(this.versionKey)) ?? '0';
      key = `${this.versionKey.replace(/version$/, '')}v${version}:${scope}`;
      const cached = await this.redis.get(key);
      if (cached) {
        this.stats.hits++;
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      this.fail('read', error);
      key = null;
    }
    this.stats.misses++;
    const value = await compute();
    if (key) {
      await this.redis
        .set(key, JSON.stringify(value), 'EX', DASHBOARD_CACHE_TTL_SECONDS)
        .catch((error: unknown) => this.fail('write', error));
    }
    return value;
  }

  async invalidate(): Promise<void> {
    await this.redis
      .incr(this.versionKey)
      .catch((error: unknown) => this.fail('invalidate', error));
  }

  private fail(what: string, error: unknown) {
    this.stats.errors++;
    this.logger.warn(`dashboard cache ${what} skipped: ${(error as Error).message}`);
  }
}
