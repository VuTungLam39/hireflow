import { foldText } from '../../common/utils/text.js';
import { maskPii } from '../ai/cv-text.js';

// Database Design 4.9
export const CV_SECTIONS = [
  'summary',
  'experience',
  'skills',
  'projects',
  'education',
  'other',
] as const;
export type CvSection = (typeof CV_SECTIONS)[number];

export interface CvChunkDraft {
  section: CvSection;
  position: number;
  content: string;
  tokenCount: number;
}

export const CHUNK_MAX_CHARS = 1200;
export const CHUNK_MAX_COUNT = 30;
const HEADING_MAX_CHARS = 40;

const HEADINGS: [CvSection, RegExp][] = [
  [
    'summary',
    /^(muc tieu|tom tat|gioi thieu|ve ban than|thong tin chung|summary|objective|profile|about me)/,
  ],
  [
    'experience',
    /^(kinh nghiem|qua trinh lam viec|lich su lam viec|work experience|experience|employment)/,
  ],
  ['skills', /^(ky nang|cong nghe|chung chi|skills|technical skills|technologies|certifications?)/],
  ['projects', /^(du an|projects?)/],
  ['education', /^(hoc van|trinh do|bang cap|giao duc|education)/],
];

const sectionOf = (folded: string) => HEADINGS.find(([, re]) => re.test(folded))?.[0];

// Kickoff 8.5
function headingOf(line: string): { section: CvSection; rest: string } | null {
  const folded = foldText(line).replace(/[:：\-–]+\s*$/, '');
  if (folded.length <= HEADING_MAX_CHARS) {
    const section = sectionOf(folded);
    if (section) return { section, rest: '' };
  }
  const colon = line.indexOf(':');
  if (colon > 0 && colon <= HEADING_MAX_CHARS) {
    const section = sectionOf(foldText(line.slice(0, colon)));
    if (section) return { section, rest: line };
  }
  return null;
}

const tokensOf = (content: string) => Math.min(32_767, Math.ceil(content.length / 4));

function piecesOf(lines: string[]): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const raw of lines) {
    for (let line = raw; line; line = line.slice(CHUNK_MAX_CHARS)) {
      const part = line.slice(0, CHUNK_MAX_CHARS);
      if (current && current.length + 1 + part.length > CHUNK_MAX_CHARS) {
        pieces.push(current);
        current = '';
      }
      current = current ? `${current}\n${part}` : part;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

// Kickoff 8.5, BR-AI-09
export function chunkCv(text: string): CvChunkDraft[] {
  const groups: { section: CvSection; lines: string[] }[] = [];
  let current = { section: 'summary' as CvSection, lines: [] as string[] };
  groups.push(current);

  for (const line of text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    const heading = headingOf(line);
    if (heading && heading.section !== current.section) {
      current = { section: heading.section, lines: [] };
      groups.push(current);
    }
    const content = heading ? heading.rest : line;
    if (content) current.lines.push(content);
  }

  const drafts: CvChunkDraft[] = [];
  for (const group of groups) {
    for (const piece of piecesOf(group.lines)) {
      const content = maskPii(piece);
      drafts.push({
        section: group.section,
        position: drafts.length,
        content,
        tokenCount: tokensOf(content),
      });
      if (drafts.length >= CHUNK_MAX_COUNT) return drafts;
    }
  }
  return drafts;
}
