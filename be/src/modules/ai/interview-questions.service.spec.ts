import { describe, expect, it } from 'vitest';
import { BusinessException } from '../../common/exceptions/index.js';
import type { JsonRequest } from './ai.types.js';
import {
  InterviewQuestionSuggester,
  relevantCvLines,
  type QuestionRequirement,
} from './interview-questions.service.js';
import { FakeLlmProvider } from './providers/fake.llm.js';

const requirements: QuestionRequirement[] = [
  { id: 'r1', label: 'NestJS', required: true, keywords: ['nestjs', 'nest.js'] },
  { id: 'r2', label: 'Kafka', required: false, keywords: ['kafka'] },
];
const cv = [
  'Nguyễn Văn A – email a@example.com, 0912 345 678',
  '3 năm phát triển REST API bằng Nest.js tại Công ty X',
  'Thiết kế module thanh toán NestJS cho ví điện tử',
  'Viết NestJS microservice thứ ba',
].join('\n');

// Mở rộng MVP 2 – E5 · BR-INT-04
describe('interview question suggestions', () => {
  it('picks at most two CV lines per criterion, accent-insensitively, with PII masked', () => {
    expect(relevantCvLines(cv, requirements[0])).toEqual([
      '3 năm phát triển REST API bằng Nest.js tại Công ty X',
      'Thiết kế module thanh toán NestJS cho ví điện tử',
    ]);
    expect(relevantCvLines(cv, requirements[1])).toEqual([]);
    expect(
      relevantCvLines('Liên hệ a@example.com khi cần, biết Kafka', requirements[1])[0],
    ).not.toContain('a@example.com');
  });

  it('maps questions back to each requirement and keeps at most three', async () => {
    const llm = new FakeLlmProvider({
      'interview-questions': () => ({
        items: [
          { criterion: 't1', questions: ['Câu một?', 'Câu hai?', 'Câu ba?', 'Câu bốn?'] },
          { criterion: 'T9', questions: ['Không thuộc tiêu chí nào?'] },
        ],
      }),
    });
    const items = await new InterviewQuestionSuggester(llm).suggest('Backend', requirements, cv);
    expect(items).toEqual([
      { requirementId: 'r1', label: 'NestJS', questions: ['Câu một?', 'Câu hai?', 'Câu ba?'] },
      { requirementId: 'r2', label: 'Kafka', questions: [] },
    ]);
  });

  it('BR-INT-04: the prompt only carries criteria and CV lines, says when the CV is silent', async () => {
    const llm = new FakeLlmProvider();
    await new InterviewQuestionSuggester(llm).suggest('Backend', requirements, cv);
    const { prompt } = llm.calls[0] as JsonRequest;
    expect(prompt).toContain('T1. NestJS (bắt buộc)');
    expect(prompt).toContain('T2: (CV không nhắc tới)');
    expect(prompt).not.toMatch(/score|điểm|evidence|bằng chứng/i);
    expect(prompt).not.toContain('a@example.com');
    expect(prompt).not.toContain('0912 345 678');
  });

  it('turns an unusable answer into AI_UNAVAILABLE instead of an empty list', async () => {
    const llm = new FakeLlmProvider({ 'interview-questions': () => ({ items: [] }) });
    await expect(
      new InterviewQuestionSuggester(llm).suggest('Backend', requirements, cv),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
