import { SAMPLE_CV } from '../ai/testing/cv-fixtures.js';
import { CHUNK_MAX_CHARS, CHUNK_MAX_COUNT, chunkCv } from './cv-chunks.js';

const SEED_CV = [
  'Nguyễn Hoàng Nam',
  'Backend Developer – NestJS, PostgreSQL',
  'Email: nam.nguyenhoang@gmail.com | Điện thoại: 0912 458 731 | Hà Nội',
  'MỤC TIÊU NGHỀ NGHIỆP',
  'Hơn 4 năm phát triển backend cho hệ thống thương mại điện tử.',
  'KINH NGHIỆM LÀM VIỆC',
  'Backend Developer – Công ty Giao vận Nhanh Việt (03/2023 – nay)',
  '3 năm phát triển REST API bằng NestJS.',
  'KỸ NĂNG',
  'NestJS, PostgreSQL, Docker, Redis',
  'HỌC VẤN',
  'Kỹ sư Công nghệ thông tin – Đại học Bách khoa Hà Nội (tốt nghiệp 2021)',
].join('\n');

describe('chunkCv', () => {
  it('Kickoff 8.5: splits a CV by its section headings', () => {
    const chunks = chunkCv(SEED_CV);
    expect(chunks.map((c) => c.section)).toEqual(['summary', 'experience', 'skills', 'education']);
    expect(chunks.map((c) => c.position)).toEqual([0, 1, 2, 3]);
    expect(chunks[1].content).toBe(
      'Backend Developer – Công ty Giao vận Nhanh Việt (03/2023 – nay)\n3 năm phát triển REST API bằng NestJS.',
    );
    expect(chunks.some((c) => c.content.includes('KINH NGHIỆM'))).toBe(false);
  });

  it('keeps inline headings ("Kinh nghiệm: ...") as content of their section', () => {
    const chunks = chunkCv(SAMPLE_CV.join('\n'));
    const experience = chunks.find((c) => c.section === 'experience');
    expect(
      experience?.content.startsWith('Kinh nghiệm: 3 năm phát triển REST API bằng NestJS'),
    ).toBe(true);
    expect(chunks.find((c) => c.section === 'education')?.content).toContain('Đại học Bách khoa');
  });

  it('BR-AI-09: masks email and phone before the chunk is stored', () => {
    const all = chunkCv(SEED_CV)
      .map((c) => c.content)
      .join('\n');
    expect(all).not.toContain('nam.nguyenhoang@gmail.com');
    expect(all).not.toContain('0912 458 731');
    expect(all).toContain('[EMAIL]');
    expect(all).toContain('[PHONE]');
  });

  it('splits a long section into pieces under the size limit', () => {
    const line = 'Phát triển tính năng thanh toán bằng NestJS và PostgreSQL cho ứng dụng di động.';
    const text = ['KINH NGHIỆM', ...Array.from({ length: 60 }, () => line)].join('\n');
    const chunks = chunkCv(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.section === 'experience')).toBe(true);
    expect(chunks.every((c) => c.content.length <= CHUNK_MAX_CHARS)).toBe(true);
    expect(chunks.every((c) => c.tokenCount === Math.ceil(c.content.length / 4))).toBe(true);
  });

  it(`stops at ${CHUNK_MAX_COUNT} chunks per CV`, () => {
    const text = Array.from(
      { length: 200 },
      (_, i) => `${'x'.repeat(CHUNK_MAX_CHARS - 10)} ${i}`,
    ).join('\n');
    expect(chunkCv(text)).toHaveLength(CHUNK_MAX_COUNT);
  });

  it('returns nothing for an empty CV', () => {
    expect(chunkCv('  \n\n ')).toEqual([]);
  });
});
