import { FakeEmbeddingProvider } from './fake.embedding.js';
import { FakeLlmProvider } from './fake.llm.js';
import { OllamaEmbeddingProvider } from './ollama.embedding.js';

const norm = (v: number[]) => Math.hypot(...v);

describe('FakeEmbeddingProvider', () => {
  const provider = new FakeEmbeddingProvider(1024);

  it('returns unit vectors of the configured dimension, the same for the same text', async () => {
    const [a, b, c] = await provider.embed(['NestJS 3 năm', 'NestJS 3 năm', 'Kế toán'], 'document');
    expect(a).toHaveLength(1024);
    expect(norm(a)).toBeCloseTo(1, 6);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('FakeLlmProvider', () => {
  it('returns task defaults or overrides and records calls', async () => {
    const llm = new FakeLlmProvider({
      'suggest-requirements': () => ({ requirements: [{ label: 'NestJS' }] }),
    });
    const schema = { name: 'x', schema: {} };
    expect(
      (await llm.generateJson({ task: 'extract-cv', system: '', prompt: '', schema })).data,
    ).toEqual({
      skills: [],
      experiences: [],
      education: [],
      summary: '',
    });
    expect(
      (await llm.generateJson({ task: 'suggest-requirements', system: '', prompt: '', schema }))
        .data,
    ).toEqual({ requirements: [{ label: 'NestJS' }] });
    let text = '';
    for await (const t of llm.streamText({ task: 'chat', system: '', messages: [] })) text += t;
    expect(text).toBe('Không đủ thông tin.');
    expect(llm.calls).toHaveLength(3);
  });
});

describe('OllamaEmbeddingProvider', () => {
  const fetchMock = vi.fn();
  const provider = new OllamaEmbeddingProvider({
    baseUrl: 'http://ollama.test',
    model: 'bge-m3',
    dimension: 3,
    timeoutMs: 5000,
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterAll(() => vi.unstubAllGlobals());

  it('batches texts into one /api/embed call', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          embeddings: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        }),
        { status: 200 },
      ),
    );
    const vectors = await provider.embed(['a', 'b'], 'query');
    expect(vectors).toEqual([
      [1, 0, 0],
      [0, 1, 0],
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://ollama.test/api/embed');
    expect(JSON.parse(init.body as string)).toEqual({ model: 'bge-m3', input: ['a', 'b'] });
  });

  it('skips the call for an empty list', async () => {
    expect(await provider.embed([], 'document')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects vectors that do not match EMBEDDING_DIM', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ embeddings: [[1, 0]] }), { status: 200 }),
    );
    await expect(provider.embed(['a'], 'query')).rejects.toMatchObject({ code: 'CONFIG' });
  });

  it('reports an unreachable Ollama as retryable', async () => {
    fetchMock.mockRejectedValue(new TypeError('ECONNREFUSED'));
    await expect(provider.embed(['a'], 'query')).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      retryable: true,
    });
  });
});
