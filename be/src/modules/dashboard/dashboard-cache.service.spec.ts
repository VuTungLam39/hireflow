import type { Redis } from 'ioredis';
import { AppEvents } from '../../common/events/app-events.js';
import type { RedisClients } from '../../common/redis/redis.module.js';
import { DASHBOARD_CACHE_TTL_SECONDS, DashboardCache } from './dashboard-cache.service.js';

const fakeRedis = () => {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => void store.set(k, v)),
    incr: vi.fn(async (k: string) => {
      const next = Number(store.get(k) ?? 0) + 1;
      store.set(k, String(next));
      return next;
    }),
  };
};

const make = (redis: ReturnType<typeof fakeRedis>, events = new AppEvents()) => {
  const cache = new DashboardCache(
    redis as unknown as Redis,
    { prefix: 'test:' } as RedisClients,
    events,
  );
  cache.onModuleInit();
  return { cache, events };
};

// Kickoff 14: cache dashboard
describe('DashboardCache', () => {
  it('computes once, then serves from Redis with a TTL', async () => {
    const redis = fakeRedis();
    const { cache } = make(redis);
    const compute = vi.fn(async () => ({ total: 1 }));

    expect(await cache.getOrCompute('all', compute)).toEqual({ total: 1 });
    expect(await cache.getOrCompute('all', compute)).toEqual({ total: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      'test:dashboard:v0:all',
      '{"total":1}',
      'EX',
      DASHBOARD_CACHE_TTL_SECONDS,
    );
    expect(cache.stats).toMatchObject({ hits: 1, misses: 1 });
  });

  it('keeps scopes apart and recomputes after an application or job changes', async () => {
    const redis = fakeRedis();
    const { cache, events } = make(redis);
    const compute = vi.fn(async () => ({ n: compute.mock.calls.length }));

    await cache.getOrCompute('all', compute);
    await cache.getOrCompute('dept:a', compute);
    expect(compute).toHaveBeenCalledTimes(2);

    events.emit('application.changed', { applicationId: 'x' });
    await vi.waitFor(() => expect(redis.incr).toHaveBeenCalledTimes(1));
    await cache.getOrCompute('all', compute);
    expect(compute).toHaveBeenCalledTimes(3);

    events.emit('job.changed', { jobId: 'j' });
    await vi.waitFor(() => expect(redis.incr).toHaveBeenCalledTimes(2));
  });

  it('falls back to the database when Redis is down', async () => {
    const redis = fakeRedis();
    redis.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const { cache } = make(redis);
    const compute = vi.fn(async () => ({ total: 2 }));

    expect(await cache.getOrCompute('all', compute)).toEqual({ total: 2 });
    expect(await cache.getOrCompute('all', compute)).toEqual({ total: 2 });
    expect(compute).toHaveBeenCalledTimes(2);
    expect(redis.set).not.toHaveBeenCalled();
    expect(cache.stats.errors).toBe(2);
  });
});
