import { AiQuotaService, nextVnMidnight, vnDay } from './ai-quota.service.js';
import { AiUsageKind } from './entities/ai-usage.entity.js';

// MVP 3 · BR-AI-11
describe('VN day boundary', () => {
  it('counts the day in Vietnam time (UTC+7)', () => {
    expect(vnDay(new Date('2026-11-17T16:59:59Z'))).toBe('2026-11-17');
    expect(vnDay(new Date('2026-11-17T17:00:00Z'))).toBe('2026-11-18');
  });

  it('defers to the next 00:00 Vietnam time', () => {
    expect(nextVnMidnight(new Date('2026-11-17T10:00:00Z')).toISOString()).toBe(
      '2026-11-17T17:00:00.000Z',
    );
    expect(nextVnMidnight(new Date('2026-11-17T17:00:00Z')).toISOString()).toBe(
      '2026-11-18T17:00:00.000Z',
    );
  });
});

describe('AiQuotaService', () => {
  const setup = (counts: number[], limits = { aiDailyScoreLimit: 2, aiDailyChatLimit: 1 }) => {
    const query = vi.fn(async (sql: string) =>
      sql.startsWith('INSERT') ? [{ count: counts.shift() }] : [],
    );
    const findOneOrFail = vi.fn(async () => ({ id: 'org-1', ...limits }));
    const ds = { query, getRepository: () => ({ findOneOrFail }) };
    return { query, findOneOrFail, service: new AiQuotaService(ds as never) };
  };

  it('takes a slot while under the limit and gives it back when over', async () => {
    const { query, service } = setup([1, 2, 3]);
    expect(await service.consume('org-1', AiUsageKind.Cv)).toBe(true);
    expect(await service.consume('org-1', AiUsageKind.Cv)).toBe(true);
    expect(await service.consume('org-1', AiUsageKind.Cv)).toBe(false);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/^UPDATE ai_usage SET count = count - 1/),
      ['org-1', vnDay(), AiUsageKind.Cv],
    );
  });

  it('a limit of 0 blocks at once; chat over the limit is 429 AI_QUOTA_EXCEEDED', async () => {
    const { service } = setup([1], { aiDailyScoreLimit: 0, aiDailyChatLimit: 0 });
    await expect(service.consumeChat('org-1')).rejects.toMatchObject({
      code: 'AI_QUOTA_EXCEEDED',
      status: 429,
    });
  });

  it('caches limits for 60 seconds until invalidated', async () => {
    const { findOneOrFail, service } = setup([1, 1, 1]);
    await service.consume('org-1', AiUsageKind.Chat);
    await service.consume('org-1', AiUsageKind.Chat);
    expect(findOneOrFail).toHaveBeenCalledTimes(1);
    service.invalidate('org-1');
    await service.consume('org-1', AiUsageKind.Chat);
    expect(findOneOrFail).toHaveBeenCalledTimes(2);
  });

  it('fills 7 days of usage with zeros where nothing was used', async () => {
    const { service } = setup([]);
    const at = new Date('2026-11-17T03:00:00Z');
    const ds = (service as unknown as { dataSource: { query: ReturnType<typeof vi.fn> } })
      .dataSource;
    ds.query.mockResolvedValueOnce([
      { day: '2026-11-17', kind: AiUsageKind.Cv, count: 4 },
      { day: '2026-11-15', kind: AiUsageKind.Chat, count: 2 },
    ]);
    const usage = await service.usage('org-1', 7, at);
    expect(usage).toHaveLength(7);
    expect(usage[0]).toEqual({ day: '2026-11-17', cv: 4, chat: 0 });
    expect(usage[2]).toEqual({ day: '2026-11-15', cv: 0, chat: 2 });
    expect(usage[6].day).toBe('2026-11-11');
  });
});
