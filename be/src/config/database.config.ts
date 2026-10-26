import { registerAs } from '@nestjs/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Thư mục gốc của code đã build (dist/) – dùng cho TypeORM CLI (migration, seed)
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const connectionOptions = () =>
  process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      };

export const buildDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  ...connectionOptions(),
  ...(process.env.DB_SSL === 'true' ? { ssl: true } : {}),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [join(rootDir, '**', '*.entity.js')],
  migrations: [join(rootDir, 'database', 'migrations', '*.js')],
  migrationsTransactionMode: 'each',
});

export const databaseConfig = registerAs('database', buildDataSourceOptions);
