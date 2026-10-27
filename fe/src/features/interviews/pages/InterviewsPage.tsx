import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader } from '@/components/shared'
import { Badge, Card, Skeleton } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { INTERVIEW_STATUS } from '../lib/constants'
import { useNow } from '../hooks/use-now'
import { useInterviews } from '../hooks/use-interviews'
import { formatDay, formatTime, isLink, vnDay } from '../lib/format'
import type { Interview } from '../types'

function groupByDay(items: Interview[]) {
  const groups = new Map<string, Interview[]>()
  for (const iv of items) {
    const key = vnDay(iv.scheduledAt)
    groups.set(key, [...(groups.get(key) ?? []), iv])
  }
  return [...groups.values()]
}

// F-INT-01, F-INT-02
export default function InterviewsPage() {
  const [search, setSearch] = useSearchParams()
  const userId = useAuthStore((s) => s.user?.id)
  const isInterviewer = usePermission(Permission.InterviewFeedback)
  const canManage = usePermission(Permission.InterviewManage)
  const includeCancelled = search.get('cancelled') === '1'
  const query = useInterviews({ includeCancelled })
  const now = useNow()

  const toggleCancelled = () =>
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (includeCancelled) next.delete('cancelled')
        else next.set('cancelled', '1')
        return next
      },
      { replace: true },
    )

  const needsFeedback = (iv: Interview) =>
    isInterviewer &&
    iv.status === 'SCHEDULED' &&
    new Date(iv.scheduledAt).getTime() <= now &&
    !iv.interviewers.find((p) => p.id === userId)?.submitted

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch phỏng vấn"
        description={
          isInterviewer
            ? 'Các buổi bạn được phân công từ hôm qua đến 30 ngày tới. Bấm vào ứng viên để xem CV và gửi phiếu đánh giá.'
            : canManage
              ? 'Mọi buổi phỏng vấn từ hôm qua đến 30 ngày tới. Đặt lịch trong chi tiết hồ sơ ở bước Phỏng vấn.'
              : 'Các buổi phỏng vấn của phòng bạn từ hôm qua đến 30 ngày tới.'
        }
        actions={
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={includeCancelled}
              onChange={toggleCancelled}
            />
            Hiện buổi đã huỷ
          </label>
        }
      />

      {query.isPending ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Chưa có buổi phỏng vấn nào"
            description={
              isInterviewer
                ? 'Khi HR phân công bạn phỏng vấn, buổi đó sẽ hiện ở đây và bạn nhận thông báo.'
                : 'Mở một hồ sơ ở bước Phỏng vấn để đặt lịch.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groupByDay(query.data).map((day) => (
            <section key={day[0].scheduledAt} className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-500 capitalize">
                {formatDay(day[0].scheduledAt)}
              </h2>
              <Card className="divide-y divide-slate-100 p-0">
                {day.map((iv) => (
                  <div
                    key={iv.id}
                    className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[7rem_1fr_auto] md:items-center"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-slate-800 tabular-nums">
                      <Clock className="size-4 text-slate-400" />
                      {formatTime(iv.scheduledAt)}
                    </span>
                    <span className="min-w-0 space-y-0.5">
                      <Link
                        to={links.applicationDetail(iv.applicationId)}
                        className="text-primary block truncate font-medium hover:underline"
                      >
                        {iv.application?.candidate.fullName}
                      </Link>
                      <span className="block truncate text-slate-500">
                        {iv.application?.job.title} · Vòng {iv.round} ·{' '}
                        {iv.interviewers.map((p) => p.fullName).join(', ')}
                      </span>
                      <span className="flex min-w-0 items-center gap-1 text-slate-500">
                        <MapPin className="size-3.5 shrink-0" />
                        {isLink(iv.location) ? (
                          <a
                            href={iv.location}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate hover:underline"
                          >
                            {iv.location}
                          </a>
                        ) : (
                          <span className="truncate">{iv.location}</span>
                        )}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {needsFeedback(iv) && <Badge tone="warning">Cần gửi phiếu</Badge>}
                      <Badge tone={INTERVIEW_STATUS[iv.status].tone}>
                        {INTERVIEW_STATUS[iv.status].label}
                      </Badge>
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
