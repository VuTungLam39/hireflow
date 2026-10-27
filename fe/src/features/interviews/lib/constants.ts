import type { InterviewStatus } from '../types'

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
