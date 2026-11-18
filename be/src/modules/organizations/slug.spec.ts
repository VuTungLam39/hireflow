import { nextFreeSlug, slugify, SLUG_MAX } from './slug.js';

// BR-ORG-05
describe('slugify', () => {
  it('drops Vietnamese marks, lowercases and joins words with hyphens', () => {
    expect(slugify('Công ty Cổ phần Ví Mây')).toBe('cong-ty-co-phan-vi-may');
    expect(slugify('  Đại Lộc & Co., Ltd.  ')).toBe('dai-loc-co-ltd');
  });

  it('caps the length without a trailing hyphen and never returns an empty slug', () => {
    const slug = slugify(`${'a'.repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(slug.endsWith('-')).toBe(false);
    expect(slugify('!!!')).toBe('cong-ty');
  });

  it('adds -2, -3… when the slug is taken and keeps the cap', () => {
    expect(nextFreeSlug('vi-may', [])).toBe('vi-may');
    expect(nextFreeSlug('vi-may', ['vi-may', 'vi-may-2'])).toBe('vi-may-3');
    const long = 'a'.repeat(SLUG_MAX);
    expect(nextFreeSlug(long, [long])).toBe(`${'a'.repeat(SLUG_MAX - 2)}-2`);
  });
});
