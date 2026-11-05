import { describe, expect, it } from 'vitest';
import { toVector } from './retrieval.js';

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
