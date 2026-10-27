import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { AiStatus } from '../../common/enums/ai-status.enum.js';
import type { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { REDIS, RedisClients } from '../../common/redis/redis.module.js';
import type { NotificationView } from './notifications.service.js';

export type RealtimeEvent =
  | { kind: 'notification'; userId: string; notification: NotificationView; unreadCount: number }
  | {
      kind: 'application';
      departmentId: string;
      applicationId: string;
      jobId: string;
      status: ApplicationStatus;
      aiStatus: AiStatus;
    };

type Listener = (event: RealtimeEvent) => void;

// F-NOTI-01: Redis pub/sub để mọi instance API đều đẩy được tới kết nối SSE của mình
@Injectable()
export class RealtimeHub implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeHub.name);
  private readonly listeners = new Set<Listener>();
  private readonly channel: string;

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly clients: RedisClients,
  ) {
    this.channel = `${clients.prefix}realtime`;
  }

  async onModuleInit(): Promise<void> {
    const subscriber = this.clients.create('realtime-subscriber');
    subscriber.on('message', (channel: string, message: string) => {
      if (channel === this.channel) this.deliver(JSON.parse(message) as RealtimeEvent);
    });
    await subscriber
      .subscribe(this.channel)
      .catch((error: Error) => this.logger.warn(`Cannot subscribe: ${error.message}`));
  }

  onModuleDestroy(): void {
    this.listeners.clear();
  }

  async publish(event: RealtimeEvent): Promise<void> {
    try {
      await this.redis.publish(this.channel, JSON.stringify(event));
    } catch (error) {
      this.logger.warn(`publish fell back to local delivery: ${(error as Error).message}`);
      this.deliver(event);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get connections(): number {
    return this.listeners.size;
  }

  private deliver(event: RealtimeEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
