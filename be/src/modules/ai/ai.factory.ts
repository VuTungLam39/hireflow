import type { AiConfig, LlmProviderName } from '../../config/ai.config.js';
import type { EmbeddingProvider, LlmProvider } from './ai.types.js';
import { FakeEmbeddingProvider } from './providers/fake.embedding.js';
import { FakeLlmProvider } from './providers/fake.llm.js';
import { FallbackLlmProvider } from './providers/fallback.llm.js';
import { OllamaEmbeddingProvider } from './providers/ollama.embedding.js';
import { OpenAICompatibleEmbeddingProvider } from './providers/openai-compatible.embedding.js';
import { OpenAICompatibleLlmProvider } from './providers/openai-compatible.llm.js';

const requiredFor = (
  value: string | undefined,
  name: string,
  setting: string,
  provider: string,
) => {
  if (!value) throw new Error(`${name} is required when ${setting} includes "${provider}"`);
  return value;
};

const required = (value: string | undefined, name: string, provider: string) =>
  requiredFor(value, name, 'LLM_PROVIDERS', provider);

function buildOne(name: LlmProviderName, config: AiConfig): LlmProvider {
  switch (name) {
    case 'gemini':
      return new OpenAICompatibleLlmProvider({
        name,
        baseUrl: config.gemini.baseUrl,
        apiKey: required(config.gemini.apiKey, 'GEMINI_API_KEY', name),
        model: required(config.gemini.model, 'GEMINI_MODEL', name),
        models: config.gemini.extractModel ? { 'extract-cv': config.gemini.extractModel } : {},
        jsonMode: 'json_schema',
        timeoutMs: config.timeoutMs,
        firstTokenTimeoutMs: config.firstTokenTimeoutMs,
      });
    case 'groq':
      return new OpenAICompatibleLlmProvider({
        name,
        baseUrl: config.groq.baseUrl,
        apiKey: required(config.groq.apiKey, 'GROQ_API_KEY', name),
        model: required(config.groq.model, 'GROQ_MODEL', name),
        jsonMode: config.groq.jsonMode,
        timeoutMs: config.timeoutMs,
        firstTokenTimeoutMs: config.firstTokenTimeoutMs,
      });
    case 'ollama':
      return new OpenAICompatibleLlmProvider({
        name,
        baseUrl: `${config.ollama.baseUrl}/v1`,
        model: config.ollama.model,
        jsonMode: config.ollama.jsonMode,
        timeoutMs: config.timeoutMs * 5,
      });
    case 'fake':
      return new FakeLlmProvider();
    default:
      throw new Error(`Unknown LLM provider "${String(name)}"`);
  }
}

export function buildLlmProvider(config: AiConfig): LlmProvider {
  const providers = config.llmProviders.flatMap((name) => {
    const provider = buildOne(name, config);
    const fallback = config.gemini.fallbackModel;
    if (name !== 'gemini' || !fallback || fallback === config.gemini.model) return [provider];
    return [
      provider,
      new OpenAICompatibleLlmProvider({
        name: `gemini:${fallback}`,
        baseUrl: config.gemini.baseUrl,
        apiKey: config.gemini.apiKey,
        model: fallback,
        jsonMode: 'json_schema',
        timeoutMs: config.timeoutMs,
        firstTokenTimeoutMs: config.firstTokenTimeoutMs,
      }),
    ];
  });
  return providers.length === 1 ? providers[0] : new FallbackLlmProvider(providers);
}

export function buildEmbeddingProvider(config: AiConfig): EmbeddingProvider {
  const { provider, model, dimension, batchSize } = config.embedding;
  switch (provider) {
    case 'fake':
      return new FakeEmbeddingProvider(dimension);
    case 'gemini':
      return new OpenAICompatibleEmbeddingProvider({
        name: provider,
        baseUrl: config.gemini.baseUrl,
        apiKey: requiredFor(config.gemini.apiKey, 'GEMINI_API_KEY', 'EMBEDDING_PROVIDER', provider),
        model,
        dimension,
        batchSize,
        timeoutMs: config.timeoutMs,
      });
    case 'ollama':
      return new OllamaEmbeddingProvider({
        baseUrl: config.ollama.baseUrl,
        model,
        dimension,
        timeoutMs: config.timeoutMs,
      });
    default:
      throw new Error(`Unknown embedding provider "${String(provider)}"`);
  }
}
