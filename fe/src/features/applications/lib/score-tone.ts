import { SCORE_FAIR, SCORE_GOOD } from '../constants'

export function scoreTone(score: number) {
  if (score >= SCORE_GOOD) return { text: 'text-good-ink', bar: 'bg-good', label: 'Phù hợp cao' }
  if (score >= SCORE_FAIR) return { text: 'text-warn', bar: 'bg-warn', label: 'Phù hợp một phần' }
  return { text: 'text-bad', bar: 'bg-bad', label: 'Phù hợp thấp' }
}
