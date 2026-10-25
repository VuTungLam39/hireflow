import { Logger } from '@nestjs/common';
import {
  type AiTask,
  type JsonRequest,
  type JsonResult,
  LlmError,
  type LlmProvider,
  type StreamRequest,
} from '../ai.types.js';

export type JsonMode = 'json_schema' | 'json_object';

export interface OpenAICompatibleConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  models?: Partial<Record<AiTask, string>>;
  jsonMode: JsonMode;
  timeoutMs: number;
}

interface CompletionResponse {
  model?: string;
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

const THINK = /<think>[\s\S]*?<\/think>/g;
const FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/;

export const cleanJsonText = (text: string) => {
  const stripped = text.replace(THINK, '').trim();
  return (FENCE.exec(stripped)?.[1] ?? stripped).trim();
};

export class OpenAICompatibleLlmProvider implements LlmProvider {
  private readonly logger: Logger;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.logger = new Logger(`Llm:${config.name}`);
  }

  get name(): string {
    return this.config.name;
  }

  modelFor(task: AiTask): string {
    return this.config.models?.[task] ?? this.config.model;
  }

  async generateJson(request: JsonRequest): Promise<JsonResult> {
    const model = this.modelFor(request.task);
    const started = Date.now();
    const system =
      this.config.jsonMode === 'json_object'
        ? `${request.system}\n\nChỉ trả về một object JSON đúng schema sau, không thêm chữ nào khác:\n${JSON.stringify(request.schema.schema)}`
        : request.system;

    const response = await this.post(
      {
        model,
        temperature: 0,
        max_tokens: request.maxOutputTokens ?? 4096,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: request.prompt },
        ],
        response_format:
          this.config.jsonMode === 'json_schema'
            ? {
                type: 'json_schema',
                json_schema: {
                  name: request.schema.name,
                  schema: request.schema.schema,
                  strict: true,
                },
              }
            : { type: 'json_object' },
      },
      request.signal,
    );
    const body = (await response.json()) as CompletionResponse;
    const text = body.choices?.[0]?.message?.content ?? '';

    let data: unknown;
    try {
      data = JSON.parse(cleanJsonText(text));
    } catch {
      throw new LlmError('Model did not return valid JSON', this.name, 'INVALID_JSON', false);
    }

    const usage = {
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    };
    this.logger.log(
      `${request.task} model=${model} in=${usage.inputTokens} out=${usage.outputTokens} ${Date.now() - started}ms`,
    );
    return { data, provider: this.name, model: body.model ?? model, usage };
  }

  async *streamText(request: StreamRequest): AsyncIterable<string> {
    const response = await this.post(
      {
        model: this.modelFor(request.task),
        temperature: 0.3,
        max_tokens: request.maxOutputTokens ?? 2048,
        stream: true,
        messages: [{ role: 'system', content: request.system }, ...request.messages],
      },
      request.signal,
    );
    if (!response.body) throw new LlmError('Empty stream', this.name, 'UNAVAILABLE', true);

    const filter = new ThinkFilter();
    for await (const delta of readSseDeltas(response.body)) {
      const text = filter.push(delta);
      if (text) yield text;
    }
  }

  private async post(payload: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(payload),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new LlmError(
        `Request failed: ${(error as Error).message}`,
        this.name,
        'UNAVAILABLE',
        true,
      );
    }
    if (response.ok) return response;

    const detail = (await response.text().catch(() => '')).slice(0, 300);
    const status = response.status;
    if (status === 429) {
      throw new LlmError(`Rate limited: ${detail}`, this.name, 'RATE_LIMITED', true, status);
    }
    if (status === 408 || status >= 500) {
      throw new LlmError(`Upstream ${status}: ${detail}`, this.name, 'UNAVAILABLE', true, status);
    }
    throw new LlmError(
      `Request rejected ${status}: ${detail}`,
      this.name,
      'BAD_REQUEST',
      false,
      status,
    );
  }
}

export async function* readSseDeltas(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let index: number;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      const event = JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[] };
      const text = event.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

export class ThinkFilter {
  private pending = '';
  private thinking = false;

  push(text: string): string {
    this.pending += text;
    let output = '';
    for (;;) {
      if (this.thinking) {
        const end = this.pending.indexOf('</think>');
        if (end < 0) {
          this.pending = this.pending.slice(-'</think>'.length);
          return output;
        }
        this.pending = this.pending.slice(end + '</think>'.length);
        this.thinking = false;
        continue;
      }
      const start = this.pending.indexOf('<think>');
      if (start >= 0) {
        output += this.pending.slice(0, start);
        this.pending = this.pending.slice(start + '<think>'.length);
        this.thinking = true;
        continue;
      }
      const keep = partialTagLength(this.pending, '<think>');
      output += this.pending.slice(0, this.pending.length - keep);
      this.pending = this.pending.slice(this.pending.length - keep);
      return output;
    }
  }
}

const partialTagLength = (text: string, tag: string) => {
  for (let n = Math.min(tag.length - 1, text.length); n > 0; n--) {
    if (tag.startsWith(text.slice(-n))) return n;
  }
  return 0;
};
