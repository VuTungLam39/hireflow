import { CitationRewriter, labelOf } from './citations.js';

const targets = new Map([
  [labelOf(0), 'c1#k1'],
  [labelOf(1), 'c2#k2'],
]);

const run = (parts: string[]) => {
  const rewriter = new CitationRewriter(targets);
  return parts.map((p) => rewriter.push(p)).join('') + rewriter.flush();
};

describe('CitationRewriter', () => {
  it('API Contract 4.8: turns [S1] labels into [candidateId#chunkId]', () => {
    expect(run(['Nam biết NestJS [S1] và Docker [s2].'])).toBe(
      'Nam biết NestJS [c1#k1] và Docker [c2#k2].',
    );
  });

  it('expands grouped labels', () => {
    expect(run(['Cả hai biết Redis [S1, S2].'])).toBe('Cả hai biết Redis [c1#k1][c2#k2].');
  });

  it('drops labels that are not in sources', () => {
    expect(run(['Bịa thêm [S9], giữ [S1, S7].'])).toBe('Bịa thêm , giữ [c1#k1].');
  });

  it('handles a label split across stream tokens', () => {
    expect(run(['NestJS [', 'S', '1', '] xong'])).toBe('NestJS [c1#k1] xong');
  });

  it('holds back an unfinished label until the next token', () => {
    const rewriter = new CitationRewriter(targets);
    expect(rewriter.push('Docker [S')).toBe('Docker ');
    expect(rewriter.push('2] tốt')).toBe('[c2#k2] tốt');
  });

  it('releases ordinary brackets that never close', () => {
    const text = `Ghi chú [${'x'.repeat(60)}`;
    expect(run([text])).toBe(text);
  });

  it('keeps other bracketed text untouched', () => {
    expect(run(['Mức lương [thoả thuận] [S1]'])).toBe('Mức lương [thoả thuận] [c1#k1]');
  });
});
