import { describe, expect, it } from 'vitest';
import { buildExcerpt } from './excerpt.js';

const marked = ({ text, highlights }: ReturnType<typeof buildExcerpt>) =>
  highlights.map(([s, e]) => text.slice(s, e));

// F-SEARCH-01 · E1
describe('buildExcerpt', () => {
  it('highlights accent-insensitive matches on the original text', () => {
    const e = buildExcerpt('Kế toán tổng hợp, dùng MISA và Excel nâng cao.', 'ke toan misa');
    expect(marked(e)).toEqual(['Kế', 'toán', 'MISA']);
  });

  it('matches whole words only', () => {
    const e = buildExcerpt('Dùng Kafka Streams, không phải Kafkaesque.', 'kafka');
    expect(marked(e)).toEqual(['Kafka']);
  });

  it('cuts a long chunk around the first match with ellipses', () => {
    const filler = 'Phát triển tính năng mới cho hệ thống nội bộ. '.repeat(12);
    const e = buildExcerpt(
      `${filler}Viết test tự động bằng Playwright cho luồng thanh toán. ${filler}`,
      'playwright',
    );
    expect(e.text.startsWith('…')).toBe(true);
    expect(e.text.endsWith('…')).toBe(true);
    expect(e.text.length).toBeLessThanOrEqual(260);
    expect(marked(e)).toEqual(['Playwright']);
  });

  it('keeps short text whole and works without keywords', () => {
    expect(buildExcerpt('React, TypeScript', '')).toEqual({
      text: 'React, TypeScript',
      highlights: [],
    });
  });
});
