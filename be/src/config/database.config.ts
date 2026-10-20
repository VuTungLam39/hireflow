import { registerAs } from '@nestjs/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Thư mục gốc của code đã build (dist/) – dùng cho TypeORM CLI (migration, seed)
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export const buildDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [join(rootDir, '**', '*.entity.js')],
  migrations: [join(rootDir, 'database', 'migrations', '*.js')],
});

export const databaseConfig = registerAs('database', buildDataSourceOptions);
