import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Button, Checkbox, SegmentedControl, Skeleton } from '@/components/ui'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useNow } from '../hooks/use-now'
import { useInterviews } from '../hooks/use-interviews'
import { formatDay, formatTime, isLink, vnDay } from '../lib/format'
import type { Interview } from '../types'

type View = 'list' | 'week'

const DAY_MS = 86_400_000
const VN_OFFSET_MS = 7 * 3_600_000

function weekOf(offset: number) {
  const vnNow = new Date(Date.now() + VN_OFFSET_MS)
  const dow = (vnNow.getUTCDay() + 6) % 7
  const mondayVn = Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() - dow)
  const start = mondayVn - VN_OFFSET_MS + offset * 7 * DAY_MS
  return {
    from: new Date(start).toISOString(),
    to: new Date(start + 7 * DAY_MS - 1).toISOString(),
    days: Array.from({ length: 7 }, (_, i) => new Date(start + i * DAY_MS + VN_OFFSET_MS)),
  }
}

const short = {
  format: (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
}
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'UTC' })

function groupByDay(items: Interview[]) {
  const groups = new Map<string, Interview[]>()
  for (const iv of items) {
    const key = vnDay(iv.scheduledAt)
    groups.set(key, [...(groups.get(key) ?? []), iv])
  }
  return groups
}

// F-INT-01, F-INT-02 · Design Spec 6.8
export default function InterviewsPage() {
  const [search, setSearch] = useSearchParams()
  const userId = useAuthStore((s) => s.user?.id)
  const isInterviewer = usePermission(Permission.InterviewFeedback)
  const includeCancelled = search.get('cancelled') === '1'
  const view: View = search.get('view') === 'week' ? 'week' : 'list'
  const weekParam = search.get('w')
  const offset = Number(weekParam ?? 0) || 0
  const week = useMemo(() => weekOf(offset), [offset])
  const ranged = view === 'week' || weekParam !== null
  const query = useInterviews(
    ranged ? { includeCancelled, from: week.from, to: week.to } : { includeCancelled },
  )
  const now = useNow()

  const patch = (changes: Record<string, string | null>) =>
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true },
    )

  const needsFeedback = (iv: Interview) =>
    isInterviewer &&
    iv.status === 'SCHEDULED' &&
    new Date(iv.scheduledAt).getTime() <= now &&
    !iv.interviewers.find((p) => p.id === userId)?.submitted

  const items = query.data ?? []
  const todayKey = vnDay(new Date(now).toISOString())
  const todayCount = items.filter(
    (i) => i.status !== 'CANCELLED' && vnDay(i.scheduledAt) === todayKey,
  ).length
  const pendingFeedback = items.filter(needsFeedback).length
  const rangeLabel = `${short.format(week.days[0])} – ${short.format(week.days[6])}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch phỏng vấn"
        description={
          query.data && (
            <Summary
              items={[
                todayCount > 0 ? `${todayCount} buổi hôm nay` : 'Hôm nay không có buổi nào',
                `${items.filter((i) => i.status !== 'CANCELLED').length} buổi ${ranged ? 'trong tuần' : 'sắp tới'}`,
                pendingFeedback > 0 && (
                  <span key="fb" className="text-warn font-medium">
                    {pendingFeedback} buổi cần gửi phiếu
                  </span>
                ),
              ]}
            />
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Chế độ xem"
          options={[
            { value: 'list', label: 'Danh sách' },
            { value: 'week', label: 'Tuần' },
          ]}
          value={view}
          onChange={(v) => patch({ view: v === 'week' ? 'week' : null })}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="quiet"
            size="icon-sm"
            aria-label="Tuần trước"
            onClick={() => patch({ w: String(offset - 1) })}
          >
            <ChevronLeft />
          </Button>
          <span className="type-body-strong num min-w-28 text-center">
            {ranged ? rangeLabel : 'Sắp tới'}
          </span>
          <Button
            variant="quiet"
            size="icon-sm"
            aria-label="Tuần sau"
            onClick={() => patch({ w: String(offset + 1) })}
          >
            <ChevronRight />
          </Button>
          {ranged && offset !== 0 && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => patch({ w: view === 'week' ? '0' : null })}
            >
              Tuần này
            </Button>
          )}
        </div>
        <Checkbox
          className="ml-auto"
          label="Hiện buổi đã huỷ"
          checked={includeCancelled}
          onChange={() => patch({ cancelled: includeCancelled ? null : '1' })}
        />
      </div>

      {query.isPending ? (
        <div aria-busy aria-label="Đang tải lịch" className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : view === 'week' ? (
        <WeekView
          days={week.days}
          items={items}
          todayKey={todayKey}
          needsFeedback={needsFeedback}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={ranged ? 'Tuần này chưa có buổi phỏng vấn' : 'Chưa có buổi phỏng vấn nào sắp tới'}
          description={
            isInterviewer
              ? 'Khi HR phân công bạn phỏng vấn, buổi đó sẽ hiện ở đây và bạn nhận thông báo.'
              : 'Mở một hồ sơ ở bước Phỏng vấn để đặt lịch.'
          }
        />
      ) : (
        <div className="space-y-8">
          {[...groupByDay(items).entries()].map(([key, day]) => (
            <section key={key} aria-label={formatDay(day[0].scheduledAt)}>
              <h2 className={cn('type-overline mb-2', key === todayKey && 'text-brand')}>
                {key === todayKey ? 'Hôm nay · ' : ''}
                {formatDay(day[0].scheduledAt)}
              </h2>
              <ul className="border-line bg-surface divide-line-soft -mx-4 divide-y border-y md:mx-0 md:rounded-md md:border">
                {day.map((iv) => (
                  <AgendaRow key={iv.id} iv={iv} needsFeedback={needsFeedback(iv)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Location({ value }: { value: string }) {
  return isLink(value) ? (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="hover:text-ink truncate underline-offset-2 hover:underline"
    >
      {value}
    </a>
  ) : (
    <span className="truncate">{value}</span>
  )
}

function AgendaRow({ iv, needsFeedback }: { iv: Interview; needsFeedback: boolean }) {
  const cancelled = iv.status === 'CANCELLED'
  const end = new Date(
    new Date(iv.scheduledAt).getTime() + iv.durationMinutes * 60_000,
  ).toISOString()
  return (
    <li className="grid gap-x-6 gap-y-1 px-5 py-3.5 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:items-start">
      <p
        className={cn('num font-semibold', cancelled ? 'text-ink-muted line-through' : 'text-ink')}
      >
        {formatTime(iv.scheduledAt)}–{formatTime(end)}
      </p>
      <div className={cn('min-w-0', cancelled && 'opacity-70')}>
        <p className={cn('truncate', cancelled && 'line-through')}>
          <Link
            to={links.applicationDetail(iv.applicationId)}
            className="text-ink hover:text-brand font-semibold transition-colors"
          >
            {iv.application?.candidate.fullName}
          </Link>
          <span className="text-ink-2">
            {' '}
            · {iv.application?.job.title} · Vòng {iv.round}
          </span>
        </p>
        <p className="type-caption flex min-w-0 flex-wrap gap-x-1">
          <span className="truncate">
            {iv.interviewers
              .map((p) => `${p.fullName}${p.submitted ? ' (đã gửi phiếu)' : ''}`)
              .join(', ')}
          </span>
          <span>·</span>
          <Location value={iv.location} />
        </p>
        {cancelled && iv.cancelReason && (
          <p className="type-caption mt-0.5">Lý do huỷ: {iv.cancelReason}</p>
        )}
      </div>
      <p className="text-[13px] font-medium md:text-right">
        {cancelled ? (
          <span className="text-ink-muted">Đã huỷ</span>
        ) : needsFeedback ? (
          <span className="text-warn">Cần gửi phiếu</span>
        ) : iv.status === 'COMPLETED' ? (
          <span className="text-good-ink">Đã đủ phiếu</span>
        ) : null}
      </p>
    </li>
  )
}

function WeekView({
  days,
  items,
  todayKey,
  needsFeedback,
}: {
  days: Date[]
  items: Interview[]
  todayKey: string
  needsFeedback: (iv: Interview) => boolean
}) {
  const groups = groupByDay(items)
  return (
    <div className="-mx-4 overflow-x-auto md:mx-0">
      <div className="border-line bg-surface grid min-w-[860px] grid-cols-7 border-y md:rounded-md md:border">
        {days.map((d, i) => {
          const key = d.toISOString().slice(0, 10)
          const list = groups.get(key) ?? []
          const today = key === todayKey
          return (
            <section
              key={key}
              aria-label={formatDay(d.toISOString())}
              className={cn('min-h-72', i > 0 && 'border-line-soft border-l')}
            >
              <h2
                className={cn(
                  'border-line-soft flex items-baseline justify-between border-b px-3 py-2',
                  today ? 'bg-brand-soft' : 'bg-sunken/60',
                )}
              >
                <span className={cn('type-overline', today && 'text-brand')}>
                  {weekday.format(d)}
                </span>
                <span
                  className={cn(
                    'num font-serif text-lg font-semibold',
                    today ? 'text-brand' : 'text-ink',
                  )}
                >
                  {short.format(d)}
                </span>
              </h2>
              <ul className="space-y-2 p-2">
                {list.map((iv) => {
                  const cancelled = iv.status === 'CANCELLED'
                  return (
                    <li
                      key={iv.id}
                      className={cn(
                        'border-line bg-canvas rounded-sm border-l-2 px-2 py-1.5',
                        cancelled
                          ? 'border-l-ink-faint opacity-70'
                          : needsFeedback(iv)
                            ? 'border-l-warn'
                            : 'border-l-brand',
                      )}
                    >
                      <p
                        className={cn(
                          'num text-[13px] font-semibold',
                          cancelled ? 'text-ink-muted line-through' : 'text-ink',
                        )}
                      >
                        {formatTime(iv.scheduledAt)}
                      </p>
                      <Link
                        to={links.applicationDetail(iv.applicationId)}
                        className={cn(
                          'text-ink hover:text-brand block truncate text-[13px] font-medium',
                          cancelled && 'line-through',
                        )}
                      >
                        {iv.application?.candidate.fullName}
                      </Link>
                      <p className="type-caption truncate">
                        {iv.application?.job.title} · V{iv.round}
                      </p>
                      {needsFeedback(iv) && (
                        <p className="text-warn text-xs font-medium">Cần gửi phiếu</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
