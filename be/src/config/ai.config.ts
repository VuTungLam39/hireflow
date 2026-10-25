import { registerAs } from '@nestjs/config';

export type LlmProviderName = 'gemini' | 'groq' | 'ollama' | 'fake';
export type EmbeddingProviderName = 'gemini' | 'ollama' | 'fake';

const DEFAULT_EMBEDDING_MODEL: Record<EmbeddingProviderName, string> = {
  gemini: 'gemini-embedding-2',
  ollama: 'bge-m3',
  fake: 'fake',
};

const optional = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export const buildAiConfig = () => ({
  llmProviders: (process.env.LLM_PROVIDERS ?? 'fake')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean) as LlmProviderName[],
  timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 60000),
  promptVersion: process.env.AI_PROMPT_VERSION ?? 'v1',
  gemini: {
    baseUrl:
      process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: optional(process.env.GEMINI_API_KEY),
    model: optional(process.env.GEMINI_MODEL),
    extractModel: optional(process.env.GEMINI_MODEL_EXTRACT),
  },
  groq: {
    baseUrl: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
    apiKey: optional(process.env.GROQ_API_KEY),
    model: optional(process.env.GROQ_MODEL),
    jsonMode: (process.env.GROQ_JSON_MODE ?? 'json_object') as 'json_schema' | 'json_object',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL ?? 'qwen3:4b',
    jsonMode: (process.env.OLLAMA_JSON_MODE ?? 'json_schema') as 'json_schema' | 'json_object',
  },
  embedding: embeddingConfig(),
});

function embeddingConfig() {
  const provider = (process.env.EMBEDDING_PROVIDER ?? 'fake') as EmbeddingProviderName;
  return {
    provider,
    model: optional(process.env.EMBEDDING_MODEL) ?? DEFAULT_EMBEDDING_MODEL[provider],
    dimension: Number(process.env.EMBEDDING_DIM ?? 1024),
    batchSize: Number(process.env.EMBEDDING_BATCH_SIZE ?? 100),
  };
}

export type AiConfig = ReturnType<typeof buildAiConfig>;

export const aiConfig = registerAs('ai', buildAiConfig);
