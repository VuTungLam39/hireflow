import { registerAs } from '@nestjs/config';

export type RedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
};

const compact = (conn: RedisConnection): RedisConnection =>
  Object.fromEntries(
    Object.entries(conn).filter(([, value]) => value !== undefined && value !== ''),
  ) as RedisConnection;

const fromUrl = (raw: string): RedisConnection => {
  const url = new URL(raw);
  const db = url.pathname.replace('/', '');
  return compact({
    host: url.hostname,
    port: Number(url.port || 6379),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    db: db ? Number(db) : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  });
};

const fromParts = (): RedisConnection =>
  compact({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  });

export const buildRedisConnection = (): RedisConnection =>
  process.env.REDIS_URL ? fromUrl(process.env.REDIS_URL) : fromParts();

export const buildQueueConfig = () => ({
  redis: buildRedisConnection(),
  prefix: process.env.QUEUE_PREFIX || 'bull',
  llmPerMinute: Number(process.env.AI_LLM_PER_MINUTE ?? 10),
});

export type QueueConfig = ReturnType<typeof buildQueueConfig>;

export const queueConfig = registerAs('queue', buildQueueConfig);
