import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? 60000),
    limit: Number(process.env.THROTTLE_LIMIT ?? 100),
  },
}));
