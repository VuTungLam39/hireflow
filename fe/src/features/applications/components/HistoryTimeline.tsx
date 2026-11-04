import { ErrorState } from '@/components/shared'
import { Skeleton, TONE_DOT } from '@/components/ui'
import { cn, formatDateTime } from '@/lib/utils'
import { APPLICATION_STATUS } from '../constants'
import { useApplicationHistory } from '../hooks/use-applications'

/** Lịch sử trạng thái: ai, khi nào, từ/đến, lý do (US-07) */
export function HistoryTimeline({ applicationId }: { applicationId: string }) {
  const { data, isPending, isError, error, refetch } = useApplicationHistory(applicationId)

  if (isPending) return <Skeleton className="h-24" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  return (
    <ol className="before:bg-line relative space-y-5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px">
      {data.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className={cn(
              'absolute top-1 -left-6 size-[11px] rounded-full ring-4 ring-white',
              TONE_DOT[APPLICATION_STATUS[item.toStatus].tone],
            )}
          />
          <p className="text-ink-2 text-sm">
            {item.fromStatus ? (
              <>
                {APPLICATION_STATUS[item.fromStatus].label} →{' '}
                <span className="text-ink font-medium">
                  {APPLICATION_STATUS[item.toStatus].label}
                </span>
              </>
            ) : (
              <span className="text-ink font-medium">Nộp hồ sơ</span>
            )}
          </p>
          <p className="text-ink-faint text-xs">
            {formatDateTime(item.changedAt)} · {item.changedBy?.fullName ?? 'Ứng viên'}
          </p>
          {item.reason && (
            <p className="bg-canvas text-ink-2 mt-1.5 rounded-sm px-3 py-2 text-sm">
              {item.reason}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
