import type { InterviewStatus, Recommendation } from '../types'

export const INTERVIEW_STATUS: Record<
  InterviewStatus,
  { label: string; tone: 'info' | 'success' | 'neutral' }
> = {
  SCHEDULED: { label: 'Đã lên lịch', tone: 'info' },
  COMPLETED: { label: 'Đã đủ phiếu', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'neutral' },
}

export const SCORE_LABEL: Record<number, string> = {
  1: 'Rất yếu',
  2: 'Yếu',
  3: 'Đạt',
  4: 'Tốt',
  5: 'Rất tốt',
}

// MVP 3.1 · BR-INT-06
export const RECOMMENDATION: Record<Recommendation, { label: string }> = {
  STRONG_NO: { label: 'Chắc chắn không tuyển' },
  NO: { label: 'Không nên tuyển' },
  YES: { label: 'Nên tuyển' },
  STRONG_YES: { label: 'Rất nên tuyển' },
}
export const RECOMMENDATION_ORDER: Recommendation[] = ['STRONG_YES', 'YES', 'NO', 'STRONG_NO']
