export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export type AiTask = 'extract-cv' | 'suggest-requirements' | 'chat' | 'match';

export interface JsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

export interface JsonRequest {
  task: AiTask;
  system: string;
  prompt: string;
  schema: JsonSchemaSpec;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamRequest {
  task: AiTask;
  system: string;
  messages: ChatMessage[];
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface JsonResult {
  data: unknown;
  provider: string;
  model: string;
  usage: LlmUsage;
}

export interface LlmProvider {
  readonly name: string;
  generateJson(request: JsonRequest): Promise<JsonResult>;
  streamText(request: StreamRequest): AsyncIterable<string>;
}

export type EmbeddingInput = 'query' | 'document';

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimension: number;
  embed(texts: string[], input: EmbeddingInput): Promise<number[][]>;
}

export type LlmErrorCode =
  'RATE_LIMITED' | 'UNAVAILABLE' | 'BAD_REQUEST' | 'INVALID_JSON' | 'CONFIG';

export class LlmError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly code: LlmErrorCode,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}
