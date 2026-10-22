import { createHash } from 'node:crypto';
import type { EmbeddingInput, EmbeddingProvider } from '../ai.types.js';

export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'fake';
  readonly model = 'fake';

  constructor(readonly dimension: number) {}

  embed(texts: string[], _input: EmbeddingInput): Promise<number[][]> {
    return Promise.resolve(texts.map((text) => this.vectorOf(text)));
  }

  private vectorOf(text: string): number[] {
    const values: number[] = [];
    for (let block = 0; values.length < this.dimension; block++) {
      const digest = createHash('sha256').update(`${block}:${text}`).digest();
      for (let i = 0; i < digest.length && values.length < this.dimension; i += 2) {
        values.push(digest.readInt16BE(i) / 32768);
      }
    }
    const norm = Math.hypot(...values) || 1;
    return values.map((v) => v / norm);
  }
}
