import { LlmError } from '../ai.types.js';
import {
  cleanJsonText,
  OpenAICompatibleLlmProvider,
  ThinkFilter,
  type OpenAICompatibleConfig,
} from './openai-compatible.llm.js';

const config = (patch: Partial<OpenAICompatibleConfig> = {}): OpenAICompatibleConfig => ({
  name: 'gemini',
  baseUrl: 'https://llm.test/v1',
  apiKey: 'secret',
  model: 'flash',
  models: { 'extract-cv': 'flash-lite' },
  jsonMode: 'json_schema',
  timeoutMs: 5000,
  ...patch,
});

const jsonRequest = {
  task: 'extract-cv' as const,
  system: 'Trích xuất CV',
  prompt: 'CV: Nguyễn Văn A, 3 năm NestJS',
  schema: {
    name: 'cv_profile',
    schema: { type: 'object', properties: { skills: { type: 'array' } } },
  },
};

const completion = (content: string, usage = { prompt_tokens: 120, completion_tokens: 40 }) =>
  new Response(
    JSON.stringify({ model: 'flash-lite-001', choices: [{ message: { content } }], usage }),
    {
      status: 200,
    },
  );

const sse = (events: string[]) => {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const e of events) controller.enqueue(encoder.encode(e));
        controller.close();
      },
    }),
    { status: 200 },
  );
};

const delta = (text: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;

describe('OpenAICompatibleLlmProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterAll(() => vi.unstubAllGlobals());

  const lastBody = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string);

  describe('generateJson', () => {
    it('posts a json_schema request with the per-task model and bearer key', async () => {
      fetchMock.mockResolvedValue(completion('{"skills":["NestJS"]}'));
      const result = await new OpenAICompatibleLlmProvider(config()).generateJson(jsonRequest);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://llm.test/v1/chat/completions');
      expect(init.headers).toMatchObject({ Authorization: 'Bearer secret' });
      expect(lastBody()).toMatchObject({
        model: 'flash-lite',
        temperature: 0,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'cv_profile', strict: true, schema: jsonRequest.schema.schema },
        },
        messages: [
          { role: 'system', content: 'Trích xuất CV' },
          { role: 'user', content: jsonRequest.prompt },
        ],
      });
      expect(result).toEqual({
        data: { skills: ['NestJS'] },
        provider: 'gemini',
        model: 'flash-lite-001',
        usage: { inputTokens: 120, outputTokens: 40 },
      });
    });

    it('uses the default model for other tasks and no auth header without a key', async () => {
      fetchMock.mockResolvedValue(completion('{}'));
      await new OpenAICompatibleLlmProvider(config({ apiKey: undefined })).generateJson({
        ...jsonRequest,
        task: 'suggest-requirements',
      });
      expect(lastBody().model).toBe('flash');
      expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    });

    it('json_object mode puts the schema in the system prompt', async () => {
      fetchMock.mockResolvedValue(completion('{}'));
      await new OpenAICompatibleLlmProvider(config({ jsonMode: 'json_object' })).generateJson(
        jsonRequest,
      );
      const body = lastBody();
      expect(body.response_format).toEqual({ type: 'json_object' });
      expect(body.messages[0].content).toContain(JSON.stringify(jsonRequest.schema.schema));
    });

    it('accepts JSON wrapped in a code fence or after a <think> block', async () => {
      fetchMock.mockResolvedValue(
        completion('<think>suy nghĩ…</think>\n```json\n{"ok":true}\n```'),
      );
      const result = await new OpenAICompatibleLlmProvider(config()).generateJson(jsonRequest);
      expect(result.data).toEqual({ ok: true });
    });

    it.each([
      [429, 'RATE_LIMITED', true],
      [503, 'UNAVAILABLE', true],
      [408, 'UNAVAILABLE', true],
      [400, 'BAD_REQUEST', false],
      [401, 'BAD_REQUEST', false],
    ] as const)('maps HTTP %i to %s (retryable %s)', async (status, code, retryable) => {
      fetchMock.mockResolvedValue(new Response('quota', { status }));
      const error = await new OpenAICompatibleLlmProvider(config())
        .generateJson(jsonRequest)
        .catch((e: unknown) => e as LlmError);
      expect(error).toBeInstanceOf(LlmError);
      expect(error).toMatchObject({ code, retryable, status, provider: 'gemini' });
    });

    it('treats a network failure as retryable', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      const error = await new OpenAICompatibleLlmProvider(config())
        .generateJson(jsonRequest)
        .catch((e) => e);
      expect(error).toMatchObject({ code: 'UNAVAILABLE', retryable: true });
    });

    it('reports invalid JSON as non-retryable INVALID_JSON', async () => {
      fetchMock.mockResolvedValue(completion('Xin lỗi, tôi không thể'));
      const error = await new OpenAICompatibleLlmProvider(config())
        .generateJson(jsonRequest)
        .catch((e) => e);
      expect(error).toMatchObject({ code: 'INVALID_JSON', retryable: false });
    });
  });

  describe('streamText', () => {
    it('yields deltas until [DONE], across chunk boundaries', async () => {
      const first = delta('Tìm thấy ');
      fetchMock.mockResolvedValue(
        sse([
          first.slice(0, 10),
          first.slice(10),
          delta('3 ứng viên'),
          'data: [DONE]\n\n',
          delta('bỏ qua'),
        ]),
      );
      const parts: string[] = [];
      for await (const t of new OpenAICompatibleLlmProvider(config()).streamText({
        task: 'chat',
        system: 's',
        messages: [{ role: 'user', content: 'ai biết NestJS?' }],
      })) {
        parts.push(t);
      }
      expect(parts.join('')).toBe('Tìm thấy 3 ứng viên');
      expect(lastBody()).toMatchObject({ stream: true, model: 'flash' });
    });

    it('hides <think> blocks split across deltas', async () => {
      fetchMock.mockResolvedValue(
        sse([delta('<thi'), delta('nk>nghĩ</th'), delta('ink>Kết '), delta('quả')]),
      );
      let text = '';
      for await (const t of new OpenAICompatibleLlmProvider(config()).streamText({
        task: 'chat',
        system: 's',
        messages: [],
      })) {
        text += t;
      }
      expect(text).toBe('Kết quả');
    });
  });
});

describe('cleanJsonText / ThinkFilter', () => {
  it.each([
    ['{"a":1}', '{"a":1}'],
    ['```json\n{"a":1}\n```', '{"a":1}'],
    ['<think>x</think> {"a":1} ', '{"a":1}'],
  ])('%j → %j', (input, output) => {
    expect(cleanJsonText(input)).toBe(output);
  });

  it('keeps text that only looks like the start of a tag', () => {
    const filter = new ThinkFilter();
    expect(filter.push('a < b')).toBe('a < b');
    expect(filter.push(' <t')).toBe(' ');
    expect(filter.push('ag>')).toBe('<tag>');
  });
});
