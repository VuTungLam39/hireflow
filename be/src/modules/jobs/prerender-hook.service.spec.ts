import { ConfigService } from '@nestjs/config';
import { PrerenderHookService } from './prerender-hook.service.js';

const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_x/abc';

const makeService = (deployHookUrl?: string) =>
  new PrerenderHookService(
    new ConfigService({ app: { prerender: { deployHookUrl, debounceMs: 1_000 } } }),
  );

describe('PrerenderHookService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('F-PUB-04: không gọi gì khi chưa cấu hình deploy hook', async () => {
    makeService().schedule('job.published');
    await vi.runAllTimersAsync();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-PUB-04: gộp nhiều thay đổi liên tiếp thành một lần build lại', async () => {
    const service = makeService(HOOK);
    service.schedule('job.published');
    service.schedule('job.closed');
    service.schedule('job.updated');
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(HOOK, expect.objectContaining({ method: 'POST' }));
  });

  it('F-PUB-04: lần thay đổi sau khi đã gọi hook thì hẹn một lần mới', async () => {
    const service = makeService(HOOK);
    service.schedule('job.published');
    await vi.runAllTimersAsync();
    service.schedule('job.closed');
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('F-PUB-04: hook lỗi không làm hỏng nghiệp vụ', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    makeService(HOOK).schedule('job.published');
    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
  });
});
