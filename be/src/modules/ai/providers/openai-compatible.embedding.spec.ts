import { OpenAICompatibleEmbeddingProvider } from './openai-compatible.embedding.js';

const provider = (batchSize = 100) =>
  new OpenAICompatibleEmbeddingProvider({
    name: 'gemini',
    baseUrl: 'https://llm.test/v1',
    apiKey: 'secret',
    model: 'gemini-embedding-2',
    dimension: 2,
    batchSize,
    timeoutMs: 5000,
  });

const ok = (embeddings: number[][]) =>
  new Response(
    JSON.stringify({ data: embeddings.map((embedding, index) => ({ index, embedding })) }),
    { status: 200 },
  );

describe('OpenAICompatibleEmbeddingProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterAll(() => vi.unstubAllGlobals());

  it('posts model, input and dimensions with the bearer key and returns unit vectors', async () => {
    fetchMock.mockResolvedValue(
      ok([
        [3, 4],
        [0, 2],
      ]),
    );
    const vectors = await provider().embed(['NestJS', 'Kế toán'], 'document');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://llm.test/v1/embeddings');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret' });
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'gemini-embedding-2',
      input: ['NestJS', 'Kế toán'],
      dimensions: 2,
    });
    expect(vectors[0][0]).toBeCloseTo(0.6);
    expect(vectors[0][1]).toBeCloseTo(0.8);
    expect(vectors[1]).toEqual([0, 1]);
  });

  it('splits large inputs into batches and keeps the order', async () => {
    fetchMock
      .mockResolvedValueOnce(
        ok([
          [1, 0],
          [0, 1],
        ]),
      )
      .mockResolvedValueOnce(ok([[-1, 0]]));
    const vectors = await provider(2).embed(['a', 'b', 'c'], 'document');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string).input).toEqual(['c']);
    expect(vectors).toEqual([
      [1, 0],
      [0, 1],
      [-1, 0],
    ]);
  });

  it('skips the call for an empty list', async () => {
    expect(await provider().embed([], 'query')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [429, 'RATE_LIMITED', true],
    [503, 'UNAVAILABLE', true],
    [400, 'BAD_REQUEST', false],
  ] as const)('maps HTTP %i to %s', async (status, code, retryable) => {
    fetchMock.mockResolvedValue(new Response('x', { status }));
    await expect(provider().embed(['a'], 'query')).rejects.toMatchObject({
      code,
      retryable,
      status,
    });
  });

  it('rejects vectors that do not match EMBEDDING_DIM', async () => {
    fetchMock.mockResolvedValue(ok([[1, 0, 0]]));
    await expect(provider().embed(['a'], 'query')).rejects.toMatchObject({ code: 'CONFIG' });
  });
});
