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
import { formatRelative } from '@/lib/utils'
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
}: ApplicationQueueProps) {
  const query = useQuery(applicationQueries.list({ page: 1, limit: LIMIT, ...params }))

  return (
    <Card className="flex min-w-0 flex-col gap-4">
      <CardTitle
        icon={icon}
        aside={
          <Link
            to={viewAllHref}
            className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Xem tất cả
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        {title}
        {query.data && (
          <span className="bg-sunken text-ink-2 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
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
        <EmptyState title={emptyTitle} compact />
      ) : (
        <ul className="divide-line-soft -mx-2 divide-y">
          {query.data.items.map((a) => (
            <li key={a.id} className=" ">
              <Link
                to={links.applicationDetail(a.id)}
                className="hover:bg-canvas flex items-center gap-3 rounded-sm px-2 py-2.5 transition-colors"
              >
                <Avatar name={a.candidate.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-sm font-medium">{a.candidate.fullName}</p>
                  <p className="text-ink-muted truncate text-xs">
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
