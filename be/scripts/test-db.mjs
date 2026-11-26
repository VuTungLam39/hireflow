// K-05
import { execSync } from 'node:child_process';
import pg from 'pg';

// đặt trước dotenv để .env không ghi đè
const database = (process.env.DB_DATABASE ??= 'hireflow_test');
process.env.DATABASE_URL = '';
await import('dotenv/config');

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});
await client.connect();
const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
if (!found.rowCount) await client.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
await client.end();

execSync('npm run migration:run', { stdio: 'inherit' });
