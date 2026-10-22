import type { AiTask, JsonRequest, JsonResult, LlmProvider, StreamRequest } from '../ai.types.js';

type JsonFixture = (request: JsonRequest) => unknown;
type StreamFixture = (request: StreamRequest) => string;

const DEFAULT_JSON: Record<AiTask, JsonFixture> = {
  'extract-cv': () => ({ skills: [], experiences: [], education: [], summary: '' }),
  'suggest-requirements': () => ({ requirements: [] }),
  match: () => ({ reasons: [] }),
  chat: () => ({}),
};

// Kickoff 8.7
export class FakeLlmProvider implements LlmProvider {
  readonly name = 'fake';
  readonly calls: (JsonRequest | StreamRequest)[] = [];

  constructor(
    private readonly json: Partial<Record<AiTask, JsonFixture>> = {},
    private readonly stream: StreamFixture = () => 'Không đủ thông tin.',
  ) {}

  generateJson(request: JsonRequest): Promise<JsonResult> {
    this.calls.push(request);
    const fixture = this.json[request.task] ?? DEFAULT_JSON[request.task];
    return Promise.resolve({
      data: structuredClone(fixture(request)),
      provider: this.name,
      model: 'fake',
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  }

  async *streamText(request: StreamRequest): AsyncIterable<string> {
    this.calls.push(request);
    for (const word of this.stream(request).split(/(?<= )/)) {
      if (request.signal?.aborted) return;
      yield word;
    }
  }
}
