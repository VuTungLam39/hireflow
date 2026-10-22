import type { EmbeddingInput, EmbeddingProvider } from '../ai.types.js';
import { LlmError } from '../ai.types.js';

export interface OllamaEmbeddingConfig {
  baseUrl: string;
  model: string;
  dimension: number;
  timeoutMs: number;
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'ollama';

  constructor(private readonly config: OllamaEmbeddingConfig) {}

  get model(): string {
    return this.config.model;
  }

  get dimension(): number {
    return this.config.dimension;
  }

  async embed(texts: string[], _input: EmbeddingInput): Promise<number[][]> {
    if (!texts.length) return [];
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.model, input: texts }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new LlmError(
        `Ollama unreachable: ${(error as Error).message}`,
        this.name,
        'UNAVAILABLE',
        true,
      );
    }
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      throw new LlmError(
        `Ollama ${response.status}: ${detail}`,
        this.name,
        response.status >= 500 ? 'UNAVAILABLE' : 'BAD_REQUEST',
        response.status >= 500,
        response.status,
      );
    }

    const { embeddings } = (await response.json()) as { embeddings?: number[][] };
    if (!embeddings || embeddings.length !== texts.length) {
      throw new LlmError(
        'Ollama returned a wrong number of embeddings',
        this.name,
        'UNAVAILABLE',
        false,
      );
    }
    const wrong = embeddings.find((v) => v.length !== this.dimension);
    if (wrong) {
      throw new LlmError(
        `Embedding has ${wrong.length} dimensions, EMBEDDING_DIM is ${this.dimension}`,
        this.name,
        'CONFIG',
        false,
      );
    }
    return embeddings;
  }
}
