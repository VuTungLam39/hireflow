import { findQuote, tokenizeCv } from './evidence'

describe('findQuote', () => {
  it('finds an exact quote', () => {
    expect(findQuote('3 năm NestJS cho thanh toán', 'NestJS')).toEqual([6, 12])
  })

  it('tolerates whitespace and case differences', () => {
    const text = 'Thiết kế\n  PostgreSQL   cho hệ thống'
    const r = findQuote(text, 'thiết kế postgresql')
    expect(r).not.toBeNull()
    expect(text.slice(r![0], r![1])).toBe('Thiết kế\n  PostgreSQL')
  })

  it('returns null when the quote is not in the text', () => {
    expect(findQuote('abc', 'Kafka')).toBeNull()
  })
})

describe('tokenizeCv', () => {
  it('marks every found quote and splits paragraphs', () => {
    const text = 'Dòng một NestJS\nDòng hai Docker'
    const paras = tokenizeCv(text, [
      { id: 'a', n: 1, quote: 'NestJS' },
      { id: 'b', n: 2, quote: 'Docker' },
      { id: 'c', n: 3, quote: 'Kafka' },
    ])
    expect(paras).toHaveLength(2)
    expect(paras[0]).toEqual([{ text: 'Dòng một ' }, { text: 'NestJS', mark: { id: 'a', n: 1 } }])
    expect(paras[1][1]).toEqual({ text: 'Docker', mark: { id: 'b', n: 2 } })
  })

  it('skips an overlapping quote', () => {
    const paras = tokenizeCv('NestJS và Redis', [
      { id: 'a', n: 1, quote: 'NestJS và' },
      { id: 'b', n: 2, quote: 'và Redis' },
    ])
    expect(paras[0].filter((t) => t.mark)).toHaveLength(1)
  })
})
