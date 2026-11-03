import { SCORE_FAIR, SCORE_GOOD } from '../constants'

export function scoreTone(score: number) {
  if (score >= SCORE_GOOD) return { text: 'text-good-ink', bar: 'bg-good', label: 'phù hợp' }
  if (score >= SCORE_FAIR) return { text: 'text-warn', bar: 'bg-warn', label: 'cần xem thêm' }
  return { text: 'text-bad', bar: 'bg-bad', label: 'ít phù hợp' }
}
