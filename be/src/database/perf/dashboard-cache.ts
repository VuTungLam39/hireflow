import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// Kickoff 14: dashboard cache Redis – đo thời gian khi chưa có cache và khi trúng cache
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
const ROUNDS = Number(process.env.PERF_ROUNDS ?? 30);

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const stats = (samples: number[]) => {
  const sorted = [...samples].sort((a, b) => a - b);
  return { p50: +percentile(sorted, 50).toFixed(1), p95: +percentile(sorted, 95).toFixed(1) };
};

async function main() {
  const { AppModule } = await import('../../app.module.js');
  const { setupApp } = await import('../../setup-app.js');
  const { DataSource } = await import('typeorm');
  const { DashboardCache } = await import('../../modules/dashboard/dashboard-cache.service.js');

  const app: INestApplication = await NestFactory.create(AppModule, { logger: ['error'] });
  setupApp(app);
  await app.listen(0);
  const port = (app.getHttpServer().address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api/v1`;
  const ds = app.get(DataSource);
  const cache = app.get(DashboardCache);

  const login = async (email: string) => {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    if (!res.ok) throw new Error(`Login ${email} failed: ${res.status}`);
    return ((await res.json()) as { data: { tokens: { accessToken: string } } }).data.tokens
      .accessToken;
  };
  const [admin] = await ds.query(
    `SELECT email FROM users WHERE role = 'admin' ORDER BY email LIMIT 1`,
  );
  const [manager] = await ds.query(
    `SELECT email FROM users WHERE role = 'hiring_manager' ORDER BY email LIMIT 1`,
  );
  const [{ count }] = await ds.query(`SELECT COUNT(*)::int AS count FROM applications`);
  const tokens = { Admin: await login(admin.email), 'Hiring Manager': await login(manager.email) };

  const timed = async (token: string) => {
    const start = performance.now();
    const res = await fetch(`${base}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await res.arrayBuffer();
    return performance.now() - start;
  };

  console.log(`Dashboard cache – ${count} hồ sơ, ${ROUNDS} lượt mỗi kịch bản (ms)`);
  console.log('| Người dùng | Chưa có cache p50 | p95 | Trúng cache p50 | p95 |');
  console.log('|---|---:|---:|---:|---:|');
  for (const [who, token] of Object.entries(tokens)) {
    await timed(token);
    const miss: number[] = [];
    for (let i = 0; i < ROUNDS; i++) {
      await cache.invalidate();
      miss.push(await timed(token));
    }
    const hit: number[] = [];
    for (let i = 0; i < ROUNDS; i++) hit.push(await timed(token));
    const m = stats(miss);
    const h = stats(hit);
    console.log(`| ${who} | ${m.p50} | ${m.p95} | ${h.p50} | ${h.p95} |`);
  }
  console.log(`Cache: ${JSON.stringify(cache.stats)}`);
  await app.close();
}

void main();
