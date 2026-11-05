import { describe, expect, it } from 'vitest';
import { searchKeywords } from './keywords.js';

// F-SEARCH-01 · E1
describe('searchKeywords', () => {
  it('keeps the technical terms of a Vietnamese question and drops question words', () => {
    expect(searchKeywords('Ai có kinh nghiệm Kafka và Redis?')).toBe('kafka redis');
    expect(searchKeywords('Ứng viên nào từng dùng Playwright hoặc Selenium')).toBe(
      'playwright selenium',
    );
  });

  it('folds accents like f_unaccent in the database', () => {
    expect(searchKeywords('Kế toán biết dùng MISA')).toBe('ke toan misa');
  });

  it('keeps dotted and symbol names', () => {
    expect(searchKeywords('Who knows Node.js, C# or C++?')).toBe('node.js c# c++');
  });

  it('returns nothing for a question asked only by meaning', () => {
    expect(searchKeywords('Ai có kinh nghiệm nhiều năm nhất?')).toBe('');
  });

  it('caps the number of keywords and removes duplicates', () => {
    expect(
      searchKeywords('aws aws gcp azure k8s helm argo terraform pulumi ansible').split(' '),
    ).toEqual(['aws', 'gcp', 'azure', 'k8s', 'helm', 'argo', 'terraform', 'pulumi']);
  });
});
