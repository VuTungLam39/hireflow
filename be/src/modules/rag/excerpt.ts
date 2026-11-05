import { fold } from './keywords.js';

// F-SEARCH-01 · E1: đoạn trích quanh từ khớp, kèm vị trí tô sáng trên chữ gốc (có dấu)

export const EXCERPT_WINDOW = 220;

export interface Excerpt {
  text: string;
  /** [bắt đầu, kết thúc) theo chỉ số ký tự của `text` */
  highlights: [number, number][];
}

const WORD = /[a-z0-9]/;

/** Bỏ dấu từng ký tự, giữ nguyên độ dài để vị trí khớp trên bản không dấu dùng được cho bản gốc */
const foldEach = (text: string) => [...text].map((ch) => fold(ch).charAt(0) || ch).join('');

function findMatches(folded: string, keywords: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const kw of keywords) {
    for (let at = folded.indexOf(kw); at >= 0; at = folded.indexOf(kw, at + 1)) {
      const before = folded[at - 1];
      const after = folded[at + kw.length];
      if ((before && WORD.test(before)) || (after && WORD.test(after))) continue;
      ranges.push([at, at + kw.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return ranges.filter((r, i) => i === 0 || r[0] >= ranges[i - 1][1]);
}

export function buildExcerpt(content: string, keywords: string, window = EXCERPT_WINDOW): Excerpt {
  const text = content.replace(/\s+/g, ' ').trim();
  const chars = [...text];
  const matches = findMatches(foldEach(text), keywords.split(' ').filter(Boolean));
  if (chars.length <= window) return { text, highlights: matches };

  const first = matches[0]?.[0] ?? 0;
  let start = Math.max(0, Math.min(first - Math.floor(window / 3), chars.length - window));
  let end = Math.min(chars.length, start + window);
  while (start > 0 && chars[start - 1] !== ' ' && first - start < window / 2) start--;
  while (end < chars.length && chars[end] !== ' ' && end - start < window + 20) end++;

  const prefix = start > 0 ? '…' : '';
  const suffix = end < chars.length ? '…' : '';
  const shift = prefix.length - start;
  return {
    text: `${prefix}${chars.slice(start, end).join('')}${suffix}`,
    highlights: matches
      .filter(([s, e]) => s >= start && e <= end)
      .map(([s, e]) => [s + shift, e + shift] as [number, number]),
  };
}
