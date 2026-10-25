import { foldText, normalizeKeywords } from './text.js';

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
