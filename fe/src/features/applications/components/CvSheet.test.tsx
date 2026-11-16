import { render } from '@testing-library/react'
import { CvSheet } from './CvSheet'

const text = [
  'Tóm tắt',
  'Backend Developer NestJS',
  '',
  'Kinh nghiệm',
  'Thiết kế luồng đối soát bằng Kafka',
].join('\n')
const marks = [
  { id: 'r1', n: 1, quote: 'Backend Developer NestJS' },
  { id: 'r4', n: 4, quote: 'luồng đối soát bằng Kafka' },
]

describe('CvSheet', () => {
  it('"Xem trong CV" scrolls the chosen evidence itself into view, not the top of its paragraph', () => {
    const calls: string[] = []
    Element.prototype.scrollIntoView = function (this: Element) {
      calls.push(this.getAttribute('data-mark') ?? '')
    }
    const { rerender } = render(<CvSheet text={text} marks={marks} activeId="r1" />)
    rerender(<CvSheet text={text} marks={marks} activeId="r4" />)
    expect(calls).toEqual(['r1', 'r4'])
  })
})
