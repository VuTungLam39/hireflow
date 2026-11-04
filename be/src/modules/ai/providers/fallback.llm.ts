import { Logger } from '@nestjs/common';
import {
  type JsonRequest,
  type JsonResult,
  LlmError,
  type LlmProvider,
  type StreamRequest,
} from '../ai.types.js';

export const FALLBACK_COOLDOWN_MS = 60_000;

export class FallbackLlmProvider implements LlmProvider {
  private readonly logger = new Logger('Llm:fallback');
  private readonly downUntil = new Map<LlmProvider, number>();

  constructor(
    private readonly providers: LlmProvider[],
    private readonly cooldownMs = FALLBACK_COOLDOWN_MS,
  ) {
    if (!providers.length) throw new Error('FallbackLlmProvider needs at least one provider');
  }

  get name(): string {
    return this.providers.map((p) => p.name).join('>');
  }

  async generateJson(request: JsonRequest): Promise<JsonResult> {
    let lastError: unknown;
    for (const provider of this.available()) {
      try {
        const result = await provider.generateJson(request);
        this.downUntil.delete(provider);
        return result;
      } catch (error) {
        if (!this.canFallBack(error, provider)) throw error;
        lastError = error;
      }
    }
    throw lastError;
  }

  async *streamText(request: StreamRequest): AsyncIterable<string> {
    let lastError: unknown;
    for (const provider of this.available()) {
      const iterator = provider.streamText(request)[Symbol.asyncIterator]();
      let first: IteratorResult<string>;
      try {
        first = await iterator.next();
      } catch (error) {
        if (!this.canFallBack(error, provider)) throw error;
        lastError = error;
        continue;
      }
      this.downUntil.delete(provider);
      if (first.done) return;
      yield first.value;
      for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
        yield next.value;
      }
      return;
    }
    throw lastError;
  }

  private available(): LlmProvider[] {
    const now = Date.now();
    const up = this.providers.filter((p) => (this.downUntil.get(p) ?? 0) <= now);
    return up.length ? up : this.providers;
  }

  private canFallBack(error: unknown, provider: LlmProvider): boolean {
    if (!(error instanceof LlmError) || !error.retryable) return false;
    this.downUntil.set(provider, Date.now() + this.cooldownMs);
    this.logger.warn(
      `${provider.name} ${error.code}${error.status ? ` ${error.status}` : ''}, trying next`,
    );
    return true;
  }
}
