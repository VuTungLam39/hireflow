import { cleanCvText, hasReadableText, maskPii } from './cv-text.js';

describe('maskPii', () => {
  it.each([
    ['Email: tran.van.b@gmail.com', 'Email: [EMAIL]'],
    ['Liên hệ: nguyễn.an@công-ty.vn', 'Liên hệ: [EMAIL]'],
    ['SĐT 0912 345 678', 'SĐT [PHONE]'],
    ['Phone: +84 912.345.678', 'Phone: [PHONE]'],
    ['ĐT: (+84) 912-345-678', 'ĐT: [PHONE]'],
    ['Tel 0241234567', 'Tel [PHONE]'],
  ])('%s → %s', (input, expected) => {
    expect(maskPii(input)).toBe(expected);
  });

  it('keeps years, ids and version numbers', () => {
    const text = '3 năm (2021-2024), MSSV 20194567, Node.js 20.11.1, lương 15000000';
    expect(maskPii(text)).toBe(text);
  });
});

describe('cleanCvText', () => {
  it('normalizes Unicode, collapses spaces and blank lines', () => {
    const raw = 'Kinh nghiệm  \t NestJS\u0000\n\n\n\n  Docker  ';
    expect(cleanCvText(raw)).toBe('Kinh nghiệm NestJS\n\nDocker');
  });
});

describe('hasReadableText', () => {
  it('needs at least 50 letters or digits (BR-FILE-04)', () => {
    expect(hasReadableText(' . \n - '.repeat(40))).toBe(false);
    expect(hasReadableText('a'.repeat(50))).toBe(true);
  });
});
