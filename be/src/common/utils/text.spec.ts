import { foldText, normalizeKeywords, normalizeText } from './text.js';

describe('foldText', () => {
  it.each([
    ['Bán hàng B2B', 'ban hang b2b'],
    ['  Đàm   phán ', 'dam phan'],
    ['NestJS', 'nestjs'],
    ['Quản lý khách hàng', 'quan ly khach hang'],
  ])('%s → %s', (input, expected) => {
    expect(foldText(input)).toBe(expected);
  });
});

describe('normalizeKeywords', () => {
  it('folds, drops blanks and duplicates while keeping order', () => {
    expect(normalizeKeywords(['NestJS', 'nestjs ', '', 'Nest.js', '  '])).toEqual([
      'nestjs',
      'nest.js',
    ]);
  });
});

describe('normalizeText', () => {
  it('keeps Vietnamese marks but unifies case, Unicode form and spaces', () => {
    const decomposed = 'Kinh nghiệm  3\n năm'.normalize('NFD');
    expect(normalizeText(decomposed)).toBe('kinh nghiệm 3 năm');
  });
});
