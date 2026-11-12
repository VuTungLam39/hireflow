import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, FilterMenu, Summary } from '@/components/shared'
import { Button, Skeleton } from '@/components/ui'
import { useDetailLink } from '@/hooks/use-detail'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { APPLICATION_STATUS, APPLICATION_STATUSES, type ApplicationStatus } from '../constants'
import { applicationQueries } from '../hooks/use-applications'
import { ScoreBadge, StatusPill } from './StatusBadges'

const PAGE = 20

// F-APP-01
export function JobApplicationsList({
  jobId,
  initialStatus,
}: {
  jobId: string
  initialStatus?: ApplicationStatus
}) {
  const [status, setStatus] = useState<ApplicationStatus | undefined>(initialStatus)
  const [limit, setLimit] = useState(PAGE)
  const detailLink = useDetailLink()
  const hideScore = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const query = useQuery({
    ...applicationQueries.list({
      jobId,
      status,
      page: 1,
      limit,
      sortBy: 'createdAt',
      order: 'DESC',
    }),
    placeholderData: keepPreviousData,
  })
  const items = query.data?.items
  const total = query.data?.meta.totalItems ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted num">
          <Summary
            items={[
              `${total.toLocaleString('vi-VN')} hồ sơ${status ? ` ${APPLICATION_STATUS[status].label.toLowerCase()}` : ''}`,
              'mới nộp ở trên',
            ]}
          />
        </p>
        <FilterMenu
          label="Bước"
          value={status}
          options={APPLICATION_STATUSES.map((s) => ({
            value: s,
            label: APPLICATION_STATUS[s].label,
          }))}
          onChange={(value) => {
            setStatus(value as ApplicationStatus | undefined)
            setLimit(PAGE)
          }}
        />
      </div>

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : !items?.length ? (
        <EmptyState
          compact
          title={status ? 'Không có hồ sơ ở bước này' : 'Tin chưa có hồ sơ'}
          description={
            status
              ? 'Chọn bước khác hoặc bỏ lọc.'
              : 'Hồ sơ nộp qua trang tuyển dụng hoặc tải CV hộ sẽ hiện ở đây.'
          }
        />
      ) : (
        <>
          <ul className="border-line divide-line-soft divide-y rounded-md border">
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  to={detailLink('application', a.id)}
                  className="hover:bg-canvas grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_8rem_3.5rem_6rem]"
                >
                  <span className="min-w-0">
                    <span className="text-ink block truncate font-medium">
                      {a.candidate.fullName}
                    </span>
                    <span className="type-caption block truncate">{a.candidate.email}</span>
                  </span>
                  <StatusPill status={a.status} />
                  <span className="hidden text-right sm:block">
                    {!hideScore && <ScoreBadge score={a.score} />}
                  </span>
                  <span className="type-caption num hidden text-right sm:block">
                    {formatDate(a.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {items.length < total && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                loading={query.isFetching}
                onClick={() => setLimit((l) => Math.min(100, l + PAGE))}
              >
                Tải thêm ({(total - items.length).toLocaleString('vi-VN')} hồ sơ)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
