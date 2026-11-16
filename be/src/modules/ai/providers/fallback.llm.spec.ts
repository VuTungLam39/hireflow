import { type JsonRequest, LlmError, type LlmProvider, type StreamRequest } from '../ai.types.js';
import { FallbackLlmProvider } from './fallback.llm.js';

const request: JsonRequest = {
  task: 'extract-cv',
  system: 's',
  prompt: 'p',
  schema: { name: 'x', schema: {} },
};
const streamRequest: StreamRequest = { task: 'chat', system: 's', messages: [] };

const ok = (name: string, words: string[] = ['ok']): LlmProvider => ({
  name,
  generateJson: vi.fn(async () => ({
    data: { from: name },
    provider: name,
    model: 'm',
    usage: { inputTokens: 1, outputTokens: 1 },
  })),
  async *streamText() {
    yield* words;
  },
});

const failing = (name: string, error: Error): LlmProvider => ({
  name,
  generateJson: vi.fn(async () => {
    throw error;
  }),
  streamText: () => ({
    [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(error) }),
  }),
});

const rateLimited = (name: string) => new LlmError('429', name, 'RATE_LIMITED', true, 429);

const collect = async (iterable: AsyncIterable<string>) => {
  const out: string[] = [];
  for await (const t of iterable) out.push(t);
  return out;
};

describe('FallbackLlmProvider', () => {
  it('uses the first provider when it works', async () => {
    const second = ok('groq');
    const result = await new FallbackLlmProvider([ok('gemini'), second]).generateJson(request);
    expect(result.provider).toBe('gemini');
    expect(second.generateJson).not.toHaveBeenCalled();
  });

  it('moves on after a retryable error (429, 5xx, network)', async () => {
    const result = await new FallbackLlmProvider([
      failing('gemini', rateLimited('gemini')),
      failing('groq', new LlmError('down', 'groq', 'UNAVAILABLE', true, 503)),
      ok('ollama'),
    ]).generateJson(request);
    expect(result.data).toEqual({ from: 'ollama' });
  });

  it('stops at a non-retryable error such as invalid JSON or a bad request', async () => {
    const third = ok('ollama');
    const error = new LlmError('bad json', 'gemini', 'INVALID_JSON', false);
    await expect(
      new FallbackLlmProvider([failing('gemini', error), third]).generateJson(request),
    ).rejects.toBe(error);
    expect(third.generateJson).not.toHaveBeenCalled();
  });

  it('throws the last error when every provider is exhausted', async () => {
    const last = rateLimited('groq');
    await expect(
      new FallbackLlmProvider([
        failing('gemini', rateLimited('gemini')),
        failing('groq', last),
      ]).generateJson(request),
    ).rejects.toBe(last);
  });

  it('falls back for streams that fail before the first token', async () => {
    const text = await collect(
      new FallbackLlmProvider([
        failing('gemini', rateLimited('gemini')),
        ok('groq', ['Xin ', 'chào']),
      ]).streamText(streamRequest),
    );
    expect(text).toEqual(['Xin ', 'chào']);
  });

  it('skips a provider that just failed for a while, then tries it again', async () => {
    const flaky = failing('gemini', new LlmError('503', 'gemini', 'UNAVAILABLE', true, 503));
    const backup = ok('lite');
    const chain = new FallbackLlmProvider([flaky, backup], 40);

    await chain.generateJson(request);
    await chain.generateJson(request);
    expect(flaky.generateJson).toHaveBeenCalledTimes(1);
    expect(backup.generateJson).toHaveBeenCalledTimes(2);

    await new Promise((r) => setTimeout(r, 60));
    await chain.generateJson(request);
    expect(flaky.generateJson).toHaveBeenCalledTimes(2);
  });

  it('still tries every provider when all of them are cooling down', async () => {
    const a = failing('gemini', rateLimited('gemini'));
    const b = failing('groq', rateLimited('groq'));
    const chain = new FallbackLlmProvider([a, b], 60_000);
    await expect(chain.generateJson(request)).rejects.toBeInstanceOf(LlmError);
    await expect(chain.generateJson(request)).rejects.toBeInstanceOf(LlmError);
    expect(a.generateJson).toHaveBeenCalledTimes(2);
    expect(b.generateJson).toHaveBeenCalledTimes(2);
  });

  it('gives up on a hanging provider after the attempt timeout and marks it down', async () => {
    const hanging: LlmProvider = {
      name: 'gemini',
      generateJson: vi.fn(
        ({ signal }: JsonRequest) =>
          new Promise<never>((_, reject) =>
            signal?.addEventListener('abort', () => reject(signal.reason)),
          ),
      ),
      streamText: () => ({ [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }) }),
    };
    const backup = ok('lite');
    const chain = new FallbackLlmProvider([hanging, backup], 60_000, 30);

    const result = await chain.generateJson({ ...request, signal: AbortSignal.timeout(1_000) });
    expect(result.provider).toBe('lite');

    await chain.generateJson(request);
    expect(hanging.generateJson).toHaveBeenCalledTimes(1);
  });

  it('does not cut the last provider short and stops when the caller aborts', async () => {
    const slow: LlmProvider = {
      ...ok('lite'),
      generateJson: vi.fn(async (r: JsonRequest) => {
        expect(r.signal).toBeUndefined();
        await new Promise((res) => setTimeout(res, 50));
        return {
          data: {},
          provider: 'lite',
          model: 'm',
          usage: { inputTokens: 1, outputTokens: 1 },
        };
      }),
    };
    await expect(
      new FallbackLlmProvider(
        [failing('gemini', rateLimited('gemini')), slow],
        60_000,
        10,
      ).generateJson(request),
    ).resolves.toMatchObject({ provider: 'lite' });

    const caller = new AbortController();
    const aborted = new Error('aborted by caller');
    const listening: LlmProvider = {
      ...ok('gemini'),
      generateJson: vi.fn(
        ({ signal }: JsonRequest) =>
          new Promise<never>((_, reject) =>
            signal?.addEventListener('abort', () => reject(aborted)),
          ),
      ),
    };
    const next = ok('lite');
    const pending = new FallbackLlmProvider([listening, next], 60_000, 1_000).generateJson({
      ...request,
      signal: caller.signal,
    });
    caller.abort();
    await expect(pending).rejects.toBe(aborted);
    expect(next.generateJson).not.toHaveBeenCalled();
  });

  it('names the chain in order', () => {
    expect(new FallbackLlmProvider([ok('gemini'), ok('groq')]).name).toBe('gemini>groq');
  });
});
