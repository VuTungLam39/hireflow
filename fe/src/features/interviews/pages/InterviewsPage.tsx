import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, PageHeader, Summary } from '@/components/shared'
import { Button, Checkbox, SegmentedControl, Skeleton, buttonVariants } from '@/components/ui'
import { useDetailLink } from '@/hooks/use-detail'
import { cn, formatDate } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { useNow } from '../hooks/use-now'
import { useInterviewBacklog, useInterviews } from '../hooks/use-interviews'
import { formatDay, formatTime, isLink, vnDay } from '../lib/format'
import { PENDING_LOOKBACK_DAYS, pendingOf, type PendingKind } from '../lib/pending'
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

const PENDING_LABEL: Record<PendingKind, { text: string; tone: string }> = {
  'my-feedback': { text: 'Cần gửi phiếu', tone: 'text-warn' },
  decision: { text: 'Chờ quyết định', tone: 'text-warn' },
  feedback: { text: 'Chờ phiếu', tone: 'text-ink-muted' },
}

const listClass =
  'border-line bg-surface divide-line-soft -mx-4 divide-y border-y md:mx-0 md:rounded-md md:border'

// F-INT-01, F-INT-02 · Design Spec 6.8 · App Screens 2
export default function InterviewsPage() {
  const [search, setSearch] = useSearchParams()
  const userId = useAuthStore((s) => s.user?.id)
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const includeCancelled = search.get('cancelled') === '1'
  const view: View = search.get('view') === 'week' ? 'week' : 'list'
  const offset = Number(search.get('w') ?? 0) || 0
  const week = useMemo(() => weekOf(offset), [offset])
  const [lookbackFrom] = useState(() =>
    new Date(Date.now() - PENDING_LOOKBACK_DAYS * DAY_MS).toISOString(),
  )
  const query = useInterviews(
    view === 'week'
      ? { includeCancelled, from: week.from, to: week.to }
      : { includeCancelled, from: lookbackFrom },
  )
  const backlog = useInterviewBacklog(lookbackFrom, { enabled: view === 'list' })
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

  const pendingOfIv = (iv: Interview) => pendingOf(iv, { now, userId, isInterviewer })
  const needsFeedback = (iv: Interview) => pendingOfIv(iv) === 'my-feedback'

  const items = useMemo(
    () => (view === 'list' ? [...(backlog.data ?? []), ...(query.data ?? [])] : (query.data ?? [])),
    [view, backlog.data, query.data],
  )
  const todayKey = vnDay(new Date(now).toISOString())
  const pending = items.filter((iv) => pendingOfIv(iv) !== null)
  const upcoming = items.filter(
    (iv) => pendingOfIv(iv) === null && vnDay(iv.scheduledAt) >= todayKey,
  )
  const live = (list: Interview[]) => list.filter((i) => i.status !== 'CANCELLED').length
  const todayCount = live(upcoming.filter((i) => vnDay(i.scheduledAt) === todayKey))
  const rangeLabel = `${short.format(week.days[0])} – ${short.format(week.days[6])}`
  const hasList = pending.length > 0 || upcoming.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch phỏng vấn"
        description={
          query.data &&
          (view === 'week'
            ? items.length > 0 && <Summary items={[`${live(items)} buổi trong tuần`]} />
            : hasList && (
                <Summary
                  items={[
                    pending.length > 0 && (
                      <span key="p" className="text-warn font-medium">
                        {pending.length} buổi cần xử lý
                      </span>
                    ),
                    todayCount > 0 && `${todayCount} buổi hôm nay`,
                    `${live(upcoming)} buổi sắp tới`,
                  ]}
                />
              ))
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
          onChange={(v) => patch(v === 'week' ? { view: 'week' } : { view: null, w: null })}
        />
        {view === 'week' && (
          <div className="flex items-center gap-1">
            <Button
              variant="quiet"
              size="icon-sm"
              aria-label="Tuần trước"
              onClick={() => patch({ w: String(offset - 1) })}
            >
              <ChevronLeft />
            </Button>
            <span className="type-body-strong num min-w-28 text-center">{rangeLabel}</span>
            <Button
              variant="quiet"
              size="icon-sm"
              aria-label="Tuần sau"
              onClick={() => patch({ w: String(offset + 1) })}
            >
              <ChevronRight />
            </Button>
            {offset !== 0 && (
              <Button variant="quiet" size="sm" onClick={() => patch({ w: null })}>
                Tuần này
              </Button>
            )}
          </div>
        )}
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
      ) : !hasList ? (
        <EmptyState
          title="Không có buổi nào cần xử lý hay sắp tới"
          description={
            isInterviewer
              ? 'Khi HR phân công bạn phỏng vấn, buổi đó sẽ hiện ở đây và bạn nhận thông báo.'
              : 'Lịch được đặt từ hồ sơ đang ở bước Phỏng vấn. Các buổi đã xong vẫn xem được ở chế độ Tuần.'
          }
          action={
            !isInterviewer && (
              <Link
                to={links.applications({ status: 'INTERVIEW' })}
                className={buttonVariants({ variant: 'secondary' })}
              >
                Mở hồ sơ ở bước Phỏng vấn
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section aria-labelledby="iv-pending">
              <h2 id="iv-pending" className="type-heading mb-2">
                Cần xử lý{' '}
                <span className="text-ink-muted num text-sm font-medium">{pending.length}</span>
              </h2>
              <ul className={listClass}>
                {pending.map((iv) => (
                  <AgendaRow key={iv.id} iv={iv} pending={pendingOfIv(iv)} withDate />
                ))}
              </ul>
            </section>
          )}
          {[...groupByDay(upcoming).entries()].map(([key, day]) => (
            <section key={key} aria-label={formatDay(day[0].scheduledAt)}>
              <h2 className={cn('type-heading mb-2', key === todayKey && 'text-brand')}>
                {key === todayKey ? 'Hôm nay · ' : ''}
                {formatDay(day[0].scheduledAt)}
              </h2>
              <ul className={listClass}>
                {day.map((iv) => (
                  <AgendaRow key={iv.id} iv={iv} pending={null} />
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

function AgendaRow({
  iv,
  pending,
  withDate,
}: {
  iv: Interview
  pending: PendingKind | null
  withDate?: boolean
}) {
  const detailLink = useDetailLink()
  const cancelled = iv.status === 'CANCELLED'
  const end = new Date(
    new Date(iv.scheduledAt).getTime() + iv.durationMinutes * 60_000,
  ).toISOString()
  const submitted = iv.interviewers.filter((p) => p.submitted).length
  return (
    <li className="grid gap-x-6 gap-y-1 px-5 py-3.5 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:items-start">
      <p className={cn('num', cancelled ? 'text-ink-muted line-through' : 'text-ink')}>
        {withDate && (
          <span className="text-ink-2 block text-[13px]">{formatDate(iv.scheduledAt)}</span>
        )}
        <span className="font-semibold">
          {formatTime(iv.scheduledAt)}–{formatTime(end)}
        </span>
      </p>
      <div className={cn('min-w-0', cancelled && 'opacity-70')}>
        <p className={cn('truncate', cancelled && 'line-through')}>
          <Link
            to={detailLink('application', iv.applicationId)}
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
        ) : pending ? (
          <span className={PENDING_LABEL[pending].tone}>
            {PENDING_LABEL[pending].text}
            {pending === 'feedback' && (
              <span className="num">
                {' '}
                {submitted}/{iv.interviewers.length}
              </span>
            )}
          </span>
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
  const detailLink = useDetailLink()
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
                    'num font-display text-lg font-semibold',
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
                        to={detailLink('application', iv.applicationId)}
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
