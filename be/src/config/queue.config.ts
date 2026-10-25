import { registerAs } from '@nestjs/config';

export const buildQueueConfig = () => ({
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  llmPerMinute: Number(process.env.AI_LLM_PER_MINUTE ?? 10),
});

export type QueueConfig = ReturnType<typeof buildQueueConfig>;

export const queueConfig = registerAs('queue', buildQueueConfig);
