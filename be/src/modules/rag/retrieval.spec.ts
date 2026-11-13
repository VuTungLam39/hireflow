import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { retrieveChunks, toVector } from './retrieval.js';

// BR-ACC-07, BR-INT-02, BR-AI-10
describe('retrieveChunks scope', () => {
  const run = async (role: Role, departmentId: string | null) => {
    const query = vi.fn(async () => []);
    const ds = {
      transaction: vi.fn(async (work: (m: unknown) => Promise<unknown>) => work({ query })),
    } as unknown as DataSource;
    await retrieveChunks(ds, {
      vector: [0.1],
      keywords: 'nestjs',
      embeddingModel: 'm',
      user: { role, departmentId },
    });
    const call = query.mock.calls.at(-1) as unknown as [string, unknown[]] | undefined;
    return { calls: query.mock.calls.length, sql: call?.[0] ?? '', params: call?.[1] ?? [] };
  };

  it.each([Role.Admin, Role.Hr])('%s searches every CV', async (role) => {
    const { sql } = await run(role, null);
    expect(sql).not.toContain('department_id =');
  });

  it('a hiring manager searches only their department', async () => {
    const { sql, params } = await run(Role.HiringManager, 'd-1');
    expect(sql).toContain('j.department_id =');
    expect(params).toContain('d-1');
  });

  it.each([
    [Role.HiringManager, null],
    [Role.Interviewer, null],
  ] as const)('%s without a scope gets nothing and runs no query', async (role, dep) => {
    expect((await run(role, dep)).calls).toBe(0);
  });
});

// F-SEARCH-01 · E1
describe('toVector', () => {
  const values = Array.from({ length: 1024 }, (_, i) => Math.sin(i + 0.123456789) / 7);
  const text = toVector(values);
  const parsed = text.slice(1, -1).split(',').map(Number);

  it('keeps the precision pgvector stores (float4, about 7 significant digits)', () => {
    parsed.forEach((v, i) =>
      expect(Math.abs(v - values[i])).toBeLessThanOrEqual(Math.abs(values[i]) * 1e-6),
    );
  });

  it('keeps a 1024-dimension query well under 16 KB, so the round trip is not delayed', () => {
    expect(text.length).toBeLessThan(13_000);
    expect(`[${values.join(',')}]`.length).toBeGreaterThan(19_000);
  });
});
