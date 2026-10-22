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

  it('names the chain in order', () => {
    expect(new FallbackLlmProvider([ok('gemini'), ok('groq')]).name).toBe('gemini>groq');
  });
});
