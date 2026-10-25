import { buildAiConfig } from '../../config/ai.config.js';
import { buildEmbeddingProvider, buildLlmProvider } from './ai.factory.js';
import { FakeEmbeddingProvider } from './providers/fake.embedding.js';
import { FakeLlmProvider } from './providers/fake.llm.js';
import { FallbackLlmProvider } from './providers/fallback.llm.js';
import { OllamaEmbeddingProvider } from './providers/ollama.embedding.js';
import { OpenAICompatibleEmbeddingProvider } from './providers/openai-compatible.embedding.js';
import { OpenAICompatibleLlmProvider } from './providers/openai-compatible.llm.js';

const AI_KEYS = [
  'LLM_PROVIDERS',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_MODEL_EXTRACT',
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'EMBEDDING_PROVIDER',
  'EMBEDDING_MODEL',
  'EMBEDDING_DIM',
];

const withEnv = (env: Record<string, string>) => {
  for (const key of AI_KEYS) delete process.env[key];
  Object.assign(process.env, env);
  return buildAiConfig();
};

describe('AI provider factory', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('defaults to fake providers so the app runs without keys', () => {
    const config = withEnv({});
    expect(buildLlmProvider(config)).toBeInstanceOf(FakeLlmProvider);
    const embedding = buildEmbeddingProvider(config);
    expect(embedding).toBeInstanceOf(FakeEmbeddingProvider);
    expect(embedding.dimension).toBe(1024);
  });

  it('builds a fallback chain in the configured order', () => {
    const llm = buildLlmProvider(
      withEnv({
        LLM_PROVIDERS: 'gemini,groq,ollama',
        GEMINI_API_KEY: 'g',
        GEMINI_MODEL: 'flash',
        GEMINI_MODEL_EXTRACT: 'flash-lite',
        GROQ_API_KEY: 'q',
        GROQ_MODEL: 'qwen',
      }),
    );
    expect(llm).toBeInstanceOf(FallbackLlmProvider);
    expect(llm.name).toBe('gemini>groq>ollama');
  });

  it('uses the per-task Gemini model for CV extraction', () => {
    const llm = buildLlmProvider(
      withEnv({
        LLM_PROVIDERS: 'gemini',
        GEMINI_API_KEY: 'g',
        GEMINI_MODEL: 'flash',
        GEMINI_MODEL_EXTRACT: 'lite',
      }),
    ) as OpenAICompatibleLlmProvider;
    expect(llm.modelFor('extract-cv')).toBe('lite');
    expect(llm.modelFor('chat')).toBe('flash');
  });

  it.each([
    [{ LLM_PROVIDERS: 'gemini', GEMINI_MODEL: 'flash' }, /GEMINI_API_KEY/],
    [{ LLM_PROVIDERS: 'gemini', GEMINI_API_KEY: 'g' }, /GEMINI_MODEL/],
    [{ LLM_PROVIDERS: 'groq', GROQ_MODEL: 'qwen' }, /GROQ_API_KEY/],
  ])('fails fast on missing settings %o', (env, message) => {
    expect(() => buildLlmProvider(withEnv(env))).toThrow(message);
  });

  it('builds the Ollama embedding provider with the configured dimension', () => {
    const embedding = buildEmbeddingProvider(
      withEnv({ EMBEDDING_PROVIDER: 'ollama', EMBEDDING_DIM: '1024' }),
    );
    expect(embedding).toBeInstanceOf(OllamaEmbeddingProvider);
    expect(embedding).toMatchObject({ model: 'bge-m3', dimension: 1024 });
  });

  it('builds the Gemini embedding provider with its default model', () => {
    const embedding = buildEmbeddingProvider(
      withEnv({ EMBEDDING_PROVIDER: 'gemini', GEMINI_API_KEY: 'g' }),
    );
    expect(embedding).toBeInstanceOf(OpenAICompatibleEmbeddingProvider);
    expect(embedding).toMatchObject({
      name: 'gemini',
      model: 'gemini-embedding-2',
      dimension: 1024,
    });
  });

  it('requires a Gemini key for Gemini embeddings', () => {
    expect(() => buildEmbeddingProvider(withEnv({ EMBEDDING_PROVIDER: 'gemini' }))).toThrow(
      /GEMINI_API_KEY is required when EMBEDDING_PROVIDER/,
    );
  });
});
