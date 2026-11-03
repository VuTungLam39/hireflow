import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { applicationQueries, type ApplicationListParams } from '@/features/applications'
import { useInterviews } from '@/features/interviews'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'

const day = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function weekBounds(now: Date) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - 7)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(now)
  dayEnd.setHours(23, 59, 59, 999)
  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  return {
    week: day(start),
    prevWeekFrom: day(prevStart),
    prevWeekTo: day(prevEnd),
    dayFrom: dayStart.toISOString(),
    dayTo: dayEnd.toISOString(),
    monthAgo: monthAgo.toISOString(),
    now: now.toISOString(),
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
  const [b] = useState(() => weekBounds(new Date()))
  const canRead = usePermission(Permission.ApplicationRead)

  const pending = useCount({ status: 'NEW' }, canRead)
  const highNew = useCount({ status: 'NEW', scoreMin: 70 }, canRead)
  const failed = useCount({ aiStatus: 'FAILED' }, canRead)
  const missingNew = useCount({ status: 'NEW', missingMust: 'true' }, canRead)
  const offers = useCount({ status: 'OFFER' }, canRead)
  const thisWeek = useCount({ createdFrom: b.week }, canRead)
  const lastWeek = useCount({ createdFrom: b.prevWeekFrom, createdTo: b.prevWeekTo }, canRead)

  const today = useInterviews({ from: b.dayFrom, to: b.dayTo })
  const recent = useInterviews({ from: b.monthAgo, to: b.now })
  const awaitingDecision = recent.data?.filter(
    (i) =>
      i.status !== 'CANCELLED' && i.feedbacks.length > 0 && i.application?.status === 'INTERVIEW',
  ).length

  return {
    pending,
    highNew,
    failed,
    missingNew,
    offers,
    thisWeek,
    lastWeek,
    interviewsToday: today.data?.filter((i) => i.status !== 'CANCELLED').length,
    awaitingDecision,
  }
}
