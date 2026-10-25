import { foldText } from '../../../common/utils/text.js';
import type { AiTask, JsonRequest, JsonResult, LlmProvider, StreamRequest } from '../ai.types.js';

export type JsonFixture = (request: JsonRequest) => unknown;
type StreamFixture = (request: StreamRequest) => string;

const KNOWN_SKILLS: { name: string; keywords: string[] }[] = [
  { name: 'NestJS', keywords: ['nestjs', 'nest.js'] },
  { name: 'Node.js', keywords: ['node.js', 'nodejs'] },
  { name: 'TypeScript', keywords: ['typescript'] },
  { name: 'PostgreSQL', keywords: ['postgresql', 'postgres'] },
  { name: 'MySQL', keywords: ['mysql'] },
  { name: 'Docker', keywords: ['docker'] },
  { name: 'Redis', keywords: ['redis'] },
  { name: 'React', keywords: ['react', 'reactjs'] },
  { name: 'Java', keywords: ['java', 'spring boot'] },
  { name: 'Python', keywords: ['python'] },
  { name: 'Kế toán', keywords: ['ke toan'] },
  { name: 'Excel', keywords: ['excel'] },
  { name: 'Bán hàng B2B', keywords: ['ban hang b2b', 'b2b'] },
  { name: 'Đàm phán', keywords: ['dam phan'] },
  { name: 'Marketing', keywords: ['marketing', 'digital marketing'] },
];

const blockOf = (prompt: string, tag: string) =>
  new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(prompt)?.[1] ?? prompt;

const sentencesOf = (text: string) =>
  text
    .split(/\n|(?<=[.;!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const hasKeyword = (sentence: string, keywords: string[]) => {
  const folded = ` ${foldText(sentence)
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\.(?= |$)/g, ' ')} `;
  return keywords.some((k) => folded.includes(` ${k} `));
};

const yearsIn = (sentence: string) => {
  const match = /(\d+(?:[.,]5)?)\s*(?:năm|nam|years?)/i.exec(sentence);
  return match ? Number(match[1].replace(',', '.')) : null;
};

// Kickoff 8.7: trích kỹ năng theo từ điển, bằng chứng là câu chứa kỹ năng
export const fakeExtract: JsonFixture = ({ prompt }) => {
  const sentences = sentencesOf(blockOf(prompt, 'cv'));
  const skills = KNOWN_SKILLS.flatMap(({ name, keywords }) => {
    const sentence = sentences.find((s) => hasKeyword(s, keywords));
    return sentence ? [{ name, years: yearsIn(sentence), evidence: sentence }] : [];
  });
  return { skills, experiences: [], education: [], summary: sentences[0] ?? '' };
};

export const fakeSuggest: JsonFixture = ({ prompt }) => {
  const sentences = sentencesOf(blockOf(prompt, 'jd'));
  const found = KNOWN_SKILLS.filter(({ keywords }) =>
    sentences.some((s) => hasKeyword(s, keywords)),
  );
  const picked = found.length ? found.slice(0, 8) : KNOWN_SKILLS.slice(0, 1);
  return {
    requirements: picked.map(({ name, keywords }, i) => ({
      label: name,
      type: i < 2 ? 'MUST' : 'NICE',
      weight: i < 2 ? 3 : 1,
      minYears: null,
      keywords,
    })),
  };
};

const DEFAULT_JSON: Record<AiTask, JsonFixture> = {
  'extract-cv': fakeExtract,
  'suggest-requirements': fakeSuggest,
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
