import { ErrorState } from '@/components/shared'
import { Skeleton, TONE_DOT } from '@/components/ui'
import { cn, formatDateTime, staggerStyle } from '@/lib/utils'
import { APPLICATION_STATUS } from '../constants'
import { useApplicationHistory } from '../hooks/use-applications'

/** Lịch sử trạng thái: ai, khi nào, từ/đến, lý do (US-07) */
export function HistoryTimeline({ applicationId }: { applicationId: string }) {
  const { data, isPending, isError, error, refetch } = useApplicationHistory(applicationId)

  if (isPending) return <Skeleton className="h-24" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />

  return (
    <ol className="relative space-y-5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-slate-200">
      {data.map((item, index) => (
        <li key={item.id} style={staggerStyle(index)} className="animate-slide-up stagger relative">
          <span
            aria-hidden
            className={cn(
              'absolute top-1 -left-6 size-[11px] rounded-full ring-4 ring-white',
              TONE_DOT[APPLICATION_STATUS[item.toStatus].tone],
            )}
          />
          <p className="text-sm text-slate-600">
            {item.fromStatus ? (
              <>
                {APPLICATION_STATUS[item.fromStatus].label} →{' '}
                <span className="font-medium text-slate-900">
                  {APPLICATION_STATUS[item.toStatus].label}
                </span>
              </>
            ) : (
              <span className="font-medium text-slate-900">Nộp hồ sơ</span>
            )}
          </p>
          <p className="text-xs text-slate-400">
            {formatDateTime(item.changedAt)} · {item.changedBy?.fullName ?? 'Ứng viên'}
          </p>
          {item.reason && (
            <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {item.reason}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
