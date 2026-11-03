import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState, KpiStrip, Summary, type Kpi } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { ScoreBadge } from '@/features/applications'
import { PipelineCounts, useJobOptions } from '@/features/jobs'
import { cn } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { useDashboardSummary } from '../hooks/use-dashboard'
import { useToday } from '../hooks/use-today'

interface Todo {
  key: string
  count: number | undefined
  text: (n: number) => string
  hint?: string
  to: string
  action: string
}

const n = (v: number) => v.toLocaleString('vi-VN')

// F-DASH-01 · Design Spec 6.3
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isHm = user?.role === Role.HiringManager
  const summary = useDashboardSummary()
  const t = useToday()
  const jobs = useJobOptions()
  const [today] = useState(() =>
    new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(
      new Date(),
    ),
  )

  const todos: Todo[] = [
    ...(isHm
      ? [
          {
            key: 'offers',
            count: t.offers,
            text: (c: number) => `${n(c)} đề nghị chờ bạn duyệt`,
            to: links.applications({ status: 'OFFER' }),
            action: 'Duyệt',
          },
        ]
      : []),
    {
      key: 'high',
      count: t.highNew,
      text: (c) => `${n(c)} hồ sơ mới từ 70 điểm chưa xem`,
      to: `${paths.applications}?status=NEW&scoreMin=70&sortBy=score&order=DESC`,
      action: 'Xem',
    },
    {
      key: 'decide',
      count: t.awaitingDecision,
      text: (c) => `${n(c)} buổi phỏng vấn đã có phiếu, chờ quyết định`,
      to: links.applications({ status: 'INTERVIEW' }),
      action: 'Xem',
    },
    {
      key: 'missing',
      count: t.missingNew,
      text: (c) => `${n(c)} hồ sơ mới thiếu tiêu chí bắt buộc`,
      hint: 'Nên xem nhanh để từ chối sớm hoặc giữ lại',
      to: `${paths.applications}?status=NEW&missingMust=true`,
      action: 'Xem',
    },
    ...(!isHm
      ? [
          {
            key: 'failed',
            count: t.failed,
            text: (c: number) => `${n(c)} CV không đọc được`,
            hint: 'Thường là ảnh scan – nhập nội dung CV để chấm',
            to: `${paths.applications}?aiStatus=FAILED`,
            action: 'Xử lý',
          },
        ]
      : []),
  ]
  const loadingTodos = todos.some((x) => x.count === undefined)
  const visibleTodos = todos.filter((x) => (x.count ?? 0) > 0)

  const delta =
    t.thisWeek !== undefined && t.lastWeek !== undefined ? t.thisWeek - t.lastWeek : null
  const kpis: Kpi[] = [
    {
      label: 'Hồ sơ tuần này',
      value: t.thisWeek,
      compare:
        delta === null
          ? undefined
          : delta === 0
            ? 'bằng tuần trước'
            : `${delta > 0 ? '+' : '−'}${n(Math.abs(delta))} so với tuần trước`,
      compareTone: delta === null || delta === 0 ? 'muted' : delta > 0 ? 'good' : 'bad',
      to: links.applications(),
    },
    {
      label: 'Đang phỏng vấn',
      value: summary.data?.byStatus.INTERVIEW,
      compare: t.interviewsToday ? `${n(t.interviewsToday)} buổi hôm nay` : undefined,
      to: links.applications({ status: 'INTERVIEW' }),
    },
    {
      label: 'Đã nhận việc',
      value: summary.data?.byStatus.HIRED,
      compare: summary.data ? `${n(summary.data.byStatus.OFFER)} đang ở bước đề nghị` : undefined,
      to: links.applications({ status: 'HIRED' }),
    },
    {
      label: 'Mức phù hợp trung bình',
      value: summary.data?.totals.avgScore,
      suffix: '/100',
      compare: summary.data ? `${n(summary.data.totals.processing)} CV đang đọc` : undefined,
    },
  ]

  const avgByJob = new Map(summary.data?.byJob.map((j) => [j.jobId, j.avgScore]) ?? [])
  const openJobs = (jobs.data ?? []).filter((j) => j.status === 'OPEN')

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          {t.pending === undefined ? (
            <Skeleton className="h-10 w-80 max-w-full" />
          ) : (
            <h1 className="type-title">
              {t.pending > 0 ? `${n(t.pending)} hồ sơ chờ bạn xem` : 'Không còn hồ sơ nào chờ xem'}
            </h1>
          )}
          <p className="type-body text-ink-muted mt-1.5">
            <Summary
              items={[
                t.interviewsToday !== undefined &&
                  (t.interviewsToday > 0
                    ? `${n(t.interviewsToday)} buổi phỏng vấn hôm nay`
                    : 'Hôm nay không có buổi phỏng vấn'),
                `${n(openJobs.length)} tin đang tuyển`,
                isHm && user?.department && `Số liệu của ${user.department.name}`,
              ]}
            />
          </p>
        </div>
        <p className="type-caption capitalize">{today}</p>
      </header>

      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="type-overline mb-2">
          Cần làm
        </h2>
        <div className="border-line bg-surface rounded-md border">
          {loadingTodos && visibleTodos.length === 0 ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : visibleTodos.length === 0 ? (
            <p className="type-body px-5 py-4">
              Không có việc tồn đọng. Hồ sơ mới và lịch phỏng vấn sẽ hiện ở đây khi cần bạn xử lý.
            </p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {visibleTodos.map((todo) => (
                <li key={todo.key}>
                  <Link
                    to={todo.to}
                    className="group hover:bg-canvas flex items-center gap-4 px-5 py-3.5 transition-colors"
                  >
                    <span aria-hidden className="bg-marker-strong h-5 w-1 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <span className="type-body-strong block">{todo.text(todo.count!)}</span>
                      {todo.hint && <span className="type-caption block">{todo.hint}</span>}
                    </span>
                    <span className="text-brand inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                      {todo.action}
                      <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={summary.refetch} />
      ) : (
        <section aria-label="Số liệu chính">
          <KpiStrip items={kpis} loading={summary.isPending} />
        </section>
      )}

      <section aria-labelledby="jobs-title">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 id="jobs-title" className="type-overline">
            Tin đang tuyển
          </h2>
          <Link to={paths.jobs} className="text-brand text-[13px] font-medium hover:underline">
            Tất cả tin
          </Link>
        </div>
        <div className="border-line bg-surface -mx-4 border-y md:mx-0 md:rounded-md md:border">
          {jobs.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : openJobs.length === 0 ? (
            <p className="type-body px-5 py-4">
              Chưa có tin nào đang tuyển. Đăng một tin để bắt đầu nhận hồ sơ.
            </p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {openJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-col gap-1.5 px-5 py-3.5 md:flex-row md:items-center md:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={links.jobRanking(job.id)}
                      className="type-subheading hover:text-brand transition-colors"
                    >
                      {job.title}
                    </Link>
                    <p className="type-caption">{job.department.name}</p>
                  </div>
                  <PipelineCounts
                    pipeline={job.pipeline}
                    total={job.applicationCount}
                    jobId={job.id}
                  />
                  <span className={cn('flex items-center gap-2 md:w-28 md:justify-end')}>
                    <span className="type-caption md:hidden">Điểm TB</span>
                    <ScoreBadge score={avgByJob.get(job.id) ?? null} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
