import { Logger } from '@nestjs/common';
import {
  type JsonRequest,
  type JsonResult,
  LlmError,
  type LlmProvider,
  type StreamRequest,
} from '../ai.types.js';

export class FallbackLlmProvider implements LlmProvider {
  private readonly logger = new Logger('Llm:fallback');

  constructor(private readonly providers: LlmProvider[]) {
    if (!providers.length) throw new Error('FallbackLlmProvider needs at least one provider');
  }

  get name(): string {
    return this.providers.map((p) => p.name).join('>');
  }

  async generateJson(request: JsonRequest): Promise<JsonResult> {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await provider.generateJson(request);
      } catch (error) {
        if (!this.canFallBack(error, provider)) throw error;
        lastError = error;
      }
    }
    throw lastError;
  }

  async *streamText(request: StreamRequest): AsyncIterable<string> {
    let lastError: unknown;
    for (const provider of this.providers) {
      const iterator = provider.streamText(request)[Symbol.asyncIterator]();
      let first: IteratorResult<string>;
      try {
        first = await iterator.next();
      } catch (error) {
        if (!this.canFallBack(error, provider)) throw error;
        lastError = error;
        continue;
      }
      if (first.done) return;
      yield first.value;
      for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
        yield next.value;
      }
      return;
    }
    throw lastError;
  }

  private canFallBack(error: unknown, provider: LlmProvider): boolean {
    if (!(error instanceof LlmError) || !error.retryable) return false;
    this.logger.warn(
      `${provider.name} ${error.code}${error.status ? ` ${error.status}` : ''}, trying next`,
    );
    return true;
  }
}
