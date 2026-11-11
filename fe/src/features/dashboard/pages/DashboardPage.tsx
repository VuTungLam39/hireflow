import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState, KpiStrip, Summary, type Kpi } from '@/components/shared'
import { Skeleton } from '@/components/ui'
import { SCORE_GOOD, ScoreBadge } from '@/features/applications'
import { PipelineCounts, deadlineState, useJobOptions } from '@/features/jobs'
import { cn, VN_TIME_ZONE } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { FunnelReport } from '../components/FunnelReport'
import { useDashboardSummary } from '../hooks/use-dashboard'
import { useToday } from '../hooks/use-today'
import { useDetailLink } from '@/hooks/use-detail'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'

interface Todo {
  key: string
  count: number | undefined
  text: (n: number) => string
  hint?: string
  to: string
  action: string
}

const n = (v: number) => v.toLocaleString('vi-VN')

const JOB_LIMIT = 5

// F-DASH-01 · Design Spec 6.3
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isHm = user?.role === Role.HiringManager
  const canOps = usePermission(Permission.OpsManage)
  const canCloseJobs = usePermission(Permission.JobUpdate)
  const summary = useDashboardSummary()
  const t = useToday()
  const jobs = useJobOptions()
  const detailLink = useDetailLink()
  const [today] = useState(() =>
    new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: VN_TIME_ZONE,
    }).format(new Date()),
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
      text: (c) => `${n(c)} hồ sơ mới từ ${SCORE_GOOD} điểm chưa xem`,
      to: `${paths.applications}?status=NEW&scoreMin=${SCORE_GOOD}&sortBy=score&order=DESC`,
      action: 'Xem',
    },
    {
      key: 'decide',
      count: t.awaitingDecision,
      text: (c) => `${n(c)} buổi phỏng vấn đã có phiếu, chờ quyết định`,
      to: `${paths.interviews}?pending=decision`,
      action: 'Xem',
    },
    {
      key: 'missing',
      count: t.missingNew,
      text: (c) => `${n(c)} hồ sơ mới thiếu tiêu chí bắt buộc`,
      hint: `Điểm dưới ${SCORE_GOOD} – nên xem nhanh để từ chối sớm hoặc giữ lại`,
      to: `${paths.applications}?status=NEW&scoreMax=${SCORE_GOOD - 1}&missingMust=true`,
      action: 'Xem',
    },
    {
      key: 'otherNew',
      count: t.otherNew,
      text: (c) => `${n(c)} hồ sơ mới khác chờ xem`,
      hint: `Điểm dưới ${SCORE_GOOD} hoặc chưa chấm xong`,
      to: `${paths.applications}?status=NEW&bucket=other`,
      action: 'Xem',
    },
    // BR-JOB-10
    ...(canCloseJobs
      ? [
          {
            key: 'expiredJobs',
            count: jobs.data?.filter(
              (j) => j.status === 'OPEN' && deadlineState(j.deadline)?.expired,
            ).length,
            text: (c: number) => `${n(c)} tin đã hết hạn nộp nhưng chưa đóng`,
            hint: 'Tin đã ẩn khỏi trang tuyển dụng; đóng tin khi xử lý xong hồ sơ',
            to: `${paths.jobs}?status=OPEN`,
            action: 'Xem',
          },
        ]
      : []),
    ...(canOps
      ? [
          {
            key: 'aiIssues',
            count: t.aiIssues,
            text: (c: number) => `${n(c)} hồ sơ lỗi hoặc kẹt ở bước xử lý CV`,
            hint: 'Chạy lại khi dịch vụ đọc CV ổn định, hoặc nhập nội dung CV cho ảnh scan',
            to: paths.aiQueue,
            action: 'Xử lý',
          },
        ]
      : !isHm
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
      to: links.applications({ createdFrom: t.weekStart }),
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
  const topJobs = [...openJobs]
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, JOB_LIMIT)

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
        <h2 id="todo-title" className="type-heading mb-3">
          Cần làm
          {visibleTodos.length > 0 && (
            <span className="num text-ink-muted ml-2 text-sm font-medium">
              {n(visibleTodos.length)}
            </span>
          )}
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

      <FunnelReport />

      <section aria-labelledby="jobs-title">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="jobs-title" className="type-heading">
            Tin đang tuyển
            {openJobs.length > 0 && (
              <span className="num text-ink-muted ml-2 text-sm font-medium">
                {n(openJobs.length)}
              </span>
            )}
          </h2>
          <Link
            to={`${paths.jobs}?status=OPEN`}
            className="text-brand text-[13px] font-medium hover:underline"
          >
            {openJobs.length > JOB_LIMIT ? `Xem cả ${n(openJobs.length)} tin` : 'Tất cả tin'}
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
            <>
              <div
                aria-hidden
                className="type-overline border-line hidden h-10 items-center gap-6 border-b px-5 md:flex"
              >
                <span className="flex-1">Tin</span>
                <span className="w-56 text-right">Hồ sơ</span>
                <span className="w-28 text-right">Điểm TB</span>
              </div>
              <ul className="divide-line-soft divide-y">
                {topJobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-col gap-1.5 px-5 py-3.5 md:flex-row md:items-center md:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={detailLink('job', job.id)}
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
                      className="text-left md:w-56 md:text-right"
                    />
                    <span className={cn('flex items-center gap-2 md:w-28 md:justify-end')}>
                      <span className="type-caption md:hidden">Điểm TB</span>
                      <ScoreBadge score={avgByJob.get(job.id) ?? null} />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
