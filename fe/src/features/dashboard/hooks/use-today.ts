import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SCORE_GOOD, applicationQueries, type ApplicationListParams } from '@/features/applications'
import { useAiIssueCount } from '@/features/operations'
import {
  PENDING_LOOKBACK_DAYS,
  isAwaitingDecision,
  useInterviewBacklog,
  useInterviews,
} from '@/features/interviews'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'

const DAY_MS = 86_400_000
const VN_OFFSET_MS = 7 * 3_600_000
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function weekBounds(nowMs: number) {
  const today = Math.floor((nowMs + VN_OFFSET_MS) / DAY_MS) * DAY_MS
  const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY_MS
  return {
    week: isoDay(monday),
    prevWeekFrom: isoDay(monday - 7 * DAY_MS),
    prevWeekTo: isoDay(monday - DAY_MS),
    dayFrom: new Date(today - VN_OFFSET_MS).toISOString(),
    dayTo: new Date(today - VN_OFFSET_MS + DAY_MS - 1).toISOString(),
    monthAgo: new Date(nowMs - PENDING_LOOKBACK_DAYS * DAY_MS).toISOString(),
    now: new Date(nowMs).toISOString(),
  }
}

function useCount(filter: Partial<ApplicationListParams>, enabled = true) {
  const query = useQuery({
    ...applicationQueries.list({
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      order: 'DESC',
      ...filter,
    }),
    enabled,
    staleTime: 60_000,
  })
  return query.data?.meta.totalItems
}

export function useToday() {
  const [b] = useState(() => weekBounds(Date.now()))
  const canRead = usePermission(Permission.ApplicationRead)
  const canOps = usePermission(Permission.OpsManage)
  const aiIssues = useAiIssueCount(canOps)

  const pending = useCount({ status: 'NEW' }, canRead)
  const highNew = useCount({ status: 'NEW', scoreMin: SCORE_GOOD }, canRead)
  const failed = useCount({ aiStatus: 'FAILED' }, canRead)
  const missingNew = useCount(
    { status: 'NEW', scoreMax: SCORE_GOOD - 1, missingMust: 'true' },
    canRead,
  )
  const otherNew = useCount({ status: 'NEW', bucket: 'other' }, canRead)
  const offers = useCount({ status: 'OFFER' }, canRead)
  const thisWeek = useCount({ createdFrom: b.week }, canRead)
  const lastWeek = useCount({ createdFrom: b.prevWeekFrom, createdTo: b.prevWeekTo }, canRead)

  const today = useInterviews({ from: b.dayFrom, to: b.dayTo })
  const recent = useInterviews({ from: b.monthAgo, to: b.now })
  const backlog = useInterviewBacklog(b.monthAgo)
  const awaitingDecision =
    recent.data && backlog.data
      ? [...backlog.data, ...recent.data].filter(isAwaitingDecision).length
      : undefined

  return {
    pending,
    highNew,
    failed,
    missingNew,
    otherNew,
    aiIssues,
    offers,
    thisWeek,
    lastWeek,
    weekStart: b.week,
    interviewsToday: today.data?.filter((i) => i.status !== 'CANCELLED').length,
    awaitingDecision,
  }
}
