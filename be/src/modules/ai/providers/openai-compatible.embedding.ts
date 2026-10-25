import { Logger } from '@nestjs/common';
import type { EmbeddingInput, EmbeddingProvider } from '../ai.types.js';
import { LlmError } from '../ai.types.js';

export interface OpenAICompatibleEmbeddingConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  dimension: number;
  batchSize: number;
  timeoutMs: number;
}

interface EmbeddingResponse {
  data?: { index: number; embedding: number[] }[];
}

const normalize = (v: number[]) => {
  const norm = Math.hypot(...v);
  return norm ? v.map((x) => x / norm) : v;
};

export class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(OpenAICompatibleEmbeddingProvider.name);

  constructor(private readonly config: OpenAICompatibleEmbeddingConfig) {}

  get name(): string {
    return this.config.name;
  }

  get model(): string {
    return this.config.model;
  }

  get dimension(): number {
    return this.config.dimension;
  }

  async embed(texts: string[], _input: EmbeddingInput): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      out.push(...(await this.embedBatch(texts.slice(i, i + this.config.batchSize))));
    }
    return out;
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.config.model,
          input: texts,
          dimensions: this.config.dimension,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new LlmError(
        `${this.name} unreachable: ${(error as Error).message}`,
        this.name,
        'UNAVAILABLE',
        true,
      );
    }
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      const { status } = response;
      const retryable = status === 429 || status === 408 || status >= 500;
      throw new LlmError(
        `${this.name} ${status}: ${detail}`,
        this.name,
        status === 429 ? 'RATE_LIMITED' : retryable ? 'UNAVAILABLE' : 'BAD_REQUEST',
        retryable,
        status,
      );
    }

    const { data } = (await response.json()) as EmbeddingResponse;
    if (!data || data.length !== texts.length) {
      throw new LlmError(
        `${this.name} returned a wrong number of embeddings`,
        this.name,
        'UNAVAILABLE',
        false,
      );
    }
    const vectors = [...data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
    const wrong = vectors.find((v) => v.length !== this.dimension);
    if (wrong) {
      throw new LlmError(
        `Embedding has ${wrong.length} dimensions, EMBEDDING_DIM is ${this.dimension}`,
        this.name,
        'CONFIG',
        false,
      );
    }
    this.logger.log(`embed ${this.name}/${this.model} n=${texts.length} ${Date.now() - started}ms`);
    return vectors.map(normalize);
  }
}
