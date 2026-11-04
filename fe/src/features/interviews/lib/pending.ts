import type { Interview } from '../types'

export const PENDING_LOOKBACK_DAYS = 30

export type PendingKind = 'my-feedback' | 'decision' | 'feedback'

export const isAwaitingDecision = (iv: Interview) =>
  iv.status !== 'CANCELLED' && iv.feedbacks.length > 0 && iv.application?.status === 'INTERVIEW'

export function pendingOf(
  iv: Interview,
  { now, userId, isInterviewer }: { now: number; userId?: string; isInterviewer: boolean },
): PendingKind | null {
  if (iv.status === 'CANCELLED' || new Date(iv.scheduledAt).getTime() > now) return null
  if (isInterviewer) {
    const mine = iv.interviewers.find((p) => p.id === userId)
    return iv.status === 'SCHEDULED' && mine && !mine.submitted ? 'my-feedback' : null
  }
  if (isAwaitingDecision(iv)) return 'decision'
  if (iv.status === 'SCHEDULED' && iv.interviewers.some((p) => !p.submitted)) return 'feedback'
  return null
}
