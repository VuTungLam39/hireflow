import { parseCitations } from './citations'

describe('parseCitations', () => {
  it('splits text and citations', () => {
    expect(parseCitations('An biết Kafka [c-1#k-2], Bình thì không.')).toEqual([
      { type: 'text', text: 'An biết Kafka ' },
      { type: 'citation', candidateId: 'c-1', chunkId: 'k-2' },
      { type: 'text', text: ', Bình thì không.' },
    ])
  })

  it('keeps an incomplete citation as text while streaming', () => {
    expect(parseCitations('Xem [c-1#')).toEqual([{ type: 'text', text: 'Xem [c-1#' }])
  })

  it('handles adjacent citations', () => {
    expect(parseCitations('[a#1][b#2]').map((s) => s.type)).toEqual(['citation', 'citation'])
  })
})
