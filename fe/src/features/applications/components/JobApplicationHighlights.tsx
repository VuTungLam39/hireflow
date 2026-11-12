import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/ui'
import { useDetailLink } from '@/hooks/use-detail'
import { cn, formatDaysAgo } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { applicationQueries } from '../hooks/use-applications'
import type { ApplicationListItem } from '../types'
import { ScoreBadge, StatusPill } from './StatusBadges'

const SHOWN = 3

interface JobApplicationHighlightsProps {
  jobId: string
  onOpenRanking: () => void
  onOpenAll: () => void
  className?: string
}

// F-JOB-01 · App Screens 7.8
export function JobApplicationHighlights({
  jobId,
  onOpenRanking,
  onOpenAll,
  className,
}: JobApplicationHighlightsProps) {
  const hideScore = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const base = { jobId, page: 1, limit: SHOWN }
  const top = useQuery({
    ...applicationQueries.list({ ...base, sortBy: 'score', order: 'DESC' }),
    enabled: !hideScore,
  })
  const recent = useQuery(applicationQueries.list({ ...base, sortBy: 'createdAt', order: 'DESC' }))

  return (
    <div className={cn('grid gap-6', !hideScore && 'lg:grid-cols-2', className)}>
      {!hideScore && (
        <HighlightList
          title="Điểm cao nhất"
          action="Xem xếp hạng"
          onAction={onOpenRanking}
          items={top.data?.items}
          pending={top.isPending}
          aside={(a) => <ScoreBadge score={a.score} />}
        />
      )}
      <HighlightList
        title="Mới nộp gần đây"
        action="Xem tất cả hồ sơ"
        onAction={onOpenAll}
        items={recent.data?.items}
        pending={recent.isPending}
        aside={(a) => (
          <span className="type-caption num whitespace-nowrap">{formatDaysAgo(a.createdAt)}</span>
        )}
      />
    </div>
  )
}

function HighlightList({
  title,
  action,
  onAction,
  items,
  pending,
  aside,
}: {
  title: string
  action: string
  onAction: () => void
  items: ApplicationListItem[] | undefined
  pending: boolean
  aside: (a: ApplicationListItem) => ReactNode
}) {
  const detailLink = useDetailLink()
  return (
    <section aria-label={title} className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="type-heading">{title}</h3>
        <button
          type="button"
          onClick={onAction}
          className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {action}
          <ArrowRight className="size-4" />
        </button>
      </div>
      {pending ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: SHOWN }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <ul className="border-line divide-line-soft mt-3 divide-y rounded-md border">
          {items?.map((a) => (
            <li key={a.id}>
              <Link
                to={detailLink('application', a.id)}
                className="hover:bg-canvas flex items-center justify-between gap-4 px-4 py-2.5 transition-colors"
              >
                <span className="min-w-0">
                  <span className="text-ink block truncate font-medium">
                    {a.candidate.fullName}
                  </span>
                  <StatusPill status={a.status} />
                </span>
                <span className="shrink-0 text-right">{aside(a)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
