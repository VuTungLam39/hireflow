import { cachedCheck } from './cached-check.js';

describe('cachedCheck (health storage, B2 transaction cap)', () => {
  it('reuses a success for okMs, then checks again', async () => {
    let t = 0;
    const check = cachedCheck(300_000, 60_000, () => t);
    const run = vi.fn(async () => {});
    await check(run);
    t = 299_000;
    await check(run);
    expect(run).toHaveBeenCalledTimes(1);
    t = 300_000;
    await check(run);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('keeps a failure only for failMs so recovery shows up quickly', async () => {
    let t = 0;
    const check = cachedCheck(300_000, 60_000, () => t);
    const fail = vi.fn(async () => {
      throw new Error('Transaction cap exceeded');
    });
    await expect(check(fail)).rejects.toThrow('Transaction cap exceeded');
    t = 59_000;
    await expect(check(fail)).rejects.toThrow('Transaction cap exceeded');
    expect(fail).toHaveBeenCalledTimes(1);
    t = 60_000;
    const ok = vi.fn(async () => {});
    await check(ok);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent calls', async () => {
    const check = cachedCheck(300_000, 60_000);
    let release!: () => void;
    const run = vi.fn(() => new Promise<void>((r) => (release = r)));
    const both = Promise.all([check(run), check(run)]);
    release();
    await both;
    expect(run).toHaveBeenCalledTimes(1);
  });
});
