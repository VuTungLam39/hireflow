import { useQuery } from '@tanstack/react-query'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState } from '@/components/shared'
import { Avatar, Card, CardTitle, Skeleton } from '@/components/ui'
import {
  AiStatusBadge,
  applicationQueries,
  ScoreValue,
  type ApplicationListParams,
} from '@/features/applications'
import { formatRelative, staggerStyle } from '@/lib/utils'
import { links } from '@/routes/paths'

interface ApplicationQueueProps {
  title: string
  icon: ReactNode
  /** Bộ lọc gửi lên GET /applications (dùng lại API danh sách, không cần endpoint mới) */
  params: Pick<ApplicationListParams, 'status' | 'sortBy' | 'order'>
  /** Link "Xem tất cả" mở bảng hồ sơ với cùng bộ lọc */
  viewAllHref: string
  emptyTitle: string
  emptyIcon?: LucideIcon
}

const LIMIT = 5

/** Danh sách ngắn hồ sơ cần hành động ngay trên dashboard */
export function ApplicationQueue({
  title,
  icon,
  params,
  viewAllHref,
  emptyTitle,
  emptyIcon,
}: ApplicationQueueProps) {
  const query = useQuery(applicationQueries.list({ page: 1, limit: LIMIT, ...params }))

  return (
    <Card className="flex min-w-0 flex-col gap-4">
      <CardTitle
        icon={icon}
        aside={
          <Link
            to={viewAllHref}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Xem tất cả
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        {title}
        {query.data && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
            {query.data.meta.totalItems}
          </span>
        )}
      </CardTitle>

      {query.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: LIMIT }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title={emptyTitle} icon={emptyIcon} />
      ) : (
        <ul className="-mx-2 divide-y divide-slate-100">
          {query.data.items.map((a, i) => (
            <li key={a.id} style={staggerStyle(i)} className="animate-slide-up stagger">
              <Link
                to={links.applicationDetail(a.id)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <Avatar name={a.candidate.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {a.candidate.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {a.job.title} · {formatRelative(a.createdAt)}
                  </p>
                </div>
                {a.aiStatus === 'DONE' ? (
                  <ScoreValue score={a.score} />
                ) : (
                  <AiStatusBadge status={a.aiStatus} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
