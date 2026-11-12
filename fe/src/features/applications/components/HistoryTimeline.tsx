import { ErrorState, Timeline } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import { APPLICATION_STATUS } from '../constants'
import { useApplicationHistory } from '../hooks/use-applications'

// US-07, BR-STS-06
export function HistoryTimeline({ applicationId }: { applicationId: string }) {
  const { data, isPending, isError, error, refetch } = useApplicationHistory(applicationId)

  if (isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    )
  if (isError && !data) return <ErrorState error={error} onRetry={refetch} />

  return (
    <Timeline
      items={data.map((item) => ({
        id: item.id,
        tone:
          item.toStatus === 'HIRED'
            ? 'good'
            : item.toStatus === 'REJECTED'
              ? 'bad'
              : item.toStatus === 'WITHDRAWN'
                ? 'muted'
                : 'default',
        title: item.fromStatus ? (
          <>
            {APPLICATION_STATUS[item.fromStatus].label} →{' '}
            <strong>{APPLICATION_STATUS[item.toStatus].label}</strong>
          </>
        ) : (
          <strong>Nộp hồ sơ</strong>
        ),
        meta: `${item.changedBy?.fullName ?? 'Ứng viên'} · ${formatDateTime(item.changedAt)}`,
        quote: item.reason ?? undefined,
      }))}
    />
  )
}
