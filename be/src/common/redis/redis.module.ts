import { Global, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import { queueConfig } from '../../config/queue.config.js';

export const REDIS = Symbol('REDIS');

// MVP 2: cache, pub/sub thông báo (Kickoff 7.2)
@Injectable()
export class RedisClients implements OnModuleDestroy {
  private readonly logger = new Logger(RedisClients.name);
  private readonly clients: Redis[] = [];
  readonly prefix: string;

  constructor(@Inject(queueConfig.KEY) private readonly config: ConfigType<typeof queueConfig>) {
    this.prefix = `${config.prefix}:`;
  }

  create(name: string, options: { failFast?: boolean } = {}): Redis {
    const client = new Redis({
      ...this.config.redis,
      lazyConnect: false,
      ...(options.failFast && { maxRetriesPerRequest: 1, enableOfflineQueue: false }),
    });
    client.on('error', (error: Error) => this.logger.warn(`redis ${name}: ${error.message}`));
    this.clients.push(client);
    return client;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.clients.map((c) => c.quit().catch(() => c.disconnect())));
  }
}

@Global()
@Module({
  providers: [
    RedisClients,
    {
      provide: REDIS,
      inject: [RedisClients],
      useFactory: (clients: RedisClients) => clients.create('commands', { failFast: true }),
    },
  ],
  exports: [RedisClients, REDIS],
})
export class RedisModule {}
