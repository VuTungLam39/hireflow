import {
  Briefcase,
  ChartColumn,
  CircleCheck,
  FileText,
  Gauge,
  Inbox,
  Loader,
  Plus,
  MessageSquareText,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Can, DataTable, ErrorState, PageHeader, type Column } from '@/components/shared'
import { buttonVariants, Card, CardTitle, Skeleton } from '@/components/ui'
import { APPLICATION_STATUS, ScoreValue, type ApplicationStatus } from '@/features/applications'
import { cn, staggerStyle } from '@/lib/utils'
import { Permission } from '@/lib/permissions'
import { links, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { ApplicationQueue } from '../components/ApplicationQueue'
import { useDashboardSummary } from '../hooks/use-dashboard'
import type { DashboardSummary } from '../types'

type JobRow = DashboardSummary['byJob'][number]

const STATUS_BAR: Record<string, string> = {
  neutral: 'bg-slate-300',
  info: 'bg-blue-500',
  warning: 'bg-amber-400',
  success: 'bg-emerald-500',
  danger: 'bg-red-400',
}

const jobColumns: Column<JobRow>[] = [
  {
    key: 'title',
    header: 'Vị trí',
    cell: (j) => (
      <Link to={links.jobRanking(j.jobId)} className="hover:text-primary font-medium">
        {j.title}
      </Link>
    ),
  },
  {
    key: 'total',
    header: 'Hồ sơ',
    cell: (j) => (
      <Link
        to={links.applications({ jobId: j.jobId })}
        className="text-primary font-medium tabular-nums hover:underline"
      >
        {j.total}
      </Link>
    ),
  },
  { key: 'avg', header: 'Điểm TB', cell: (j) => <ScoreValue score={j.avgScore} /> },
  { key: 'hired', header: 'Đã nhận', cell: (j) => <span className="tabular-nums">{j.hired}</span> },
]

/** Dashboard cơ bản (kickoff FR-DASH): số hồ sơ theo trạng thái, theo job, điểm trung bình */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isPending, isError, error, refetch } = useDashboardSummary()
  // Tính một lần khi mở trang (lazy initializer, không chạy lại mỗi lần render)
  const [today] = useState(() =>
    new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(),
    ),
  )

  const stats: {
    label: string
    value: number | string | undefined
    icon: LucideIcon
    tint: string
  }[] = [
    {
      label: 'Hồ sơ',
      value: data?.totals.applications,
      icon: FileText,
      tint: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Job đang tuyển',
      value: data?.totals.openJobs,
      icon: Briefcase,
      tint: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Đang chấm AI',
      value: data?.totals.processing,
      icon: Loader,
      tint: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Điểm trung bình',
      value: data ? (data.totals.avgScore ?? '—') : undefined,
      icon: Gauge,
      tint: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName ?? ''}`}
        description={
          <>
            <span className="capitalize">{today}</span>
            {' · '}
            {user?.role === 'hiring_manager' && user.department
              ? `Số liệu thuộc phòng ${user.department.name}.`
              : 'Tổng quan toàn bộ hoạt động tuyển dụng.'}
          </>
        }
        actions={
          <>
            <Can permission={Permission.AiChat}>
              <Link to={paths.aiChat} className={buttonVariants({ variant: 'secondary' })}>
                <MessageSquareText className="text-primary" />
                Hỏi trợ lý AI
              </Link>
            </Can>
            <Can permission={Permission.JobCreate}>
              <Link to={paths.jobNew} className={buttonVariants()}>
                <Plus />
                Tạo job
              </Link>
            </Can>
          </>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => (
              <StatCard key={s.label} index={i} {...s} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card className="space-y-5">
              <CardTitle icon={<ChartColumn />}>Theo trạng thái</CardTitle>
              {isPending ? (
                <div className="space-y-4">
                  {Array.from({ length: 7 }, (_, i) => (
                    <Skeleton key={i} className="h-6" />
                  ))}
                </div>
              ) : (
                <StatusBars byStatus={data.byStatus} total={data.totals.applications} />
              )}
            </Card>

            <Card className="space-y-4">
              <CardTitle icon={<Briefcase />}>Theo vị trí</CardTitle>
              <DataTable
                columns={jobColumns}
                data={data?.byJob}
                rowKey={(j) => j.jobId}
                isPending={isPending}
                isError={false}
                emptyTitle="Chưa có hồ sơ nào"
              />
            </Card>
          </div>

          {/* Việc cần làm: hai hàng chờ lấy từ API danh sách hồ sơ */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ApplicationQueue
              title="Hồ sơ mới cần xem"
              icon={<Inbox />}
              params={{ status: 'NEW', sortBy: 'createdAt', order: 'DESC' }}
              viewAllHref={links.applications({ status: 'NEW' })}
              emptyTitle="Đã xem hết hồ sơ mới"
              emptyIcon={CircleCheck}
            />
            <ApplicationQueue
              title="Điểm cao đang chờ phỏng vấn"
              icon={<Star />}
              params={{ status: 'SCREENING', sortBy: 'score', order: 'DESC' }}
              viewAllHref={`${links.applications({ status: 'SCREENING' })}&sortBy=score&order=DESC`}
              emptyTitle="Chưa có hồ sơ ở bước sàng lọc"
            />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  index,
}: {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  tint: string
  index: number
}) {
  return (
    <Card style={staggerStyle(index)} className="animate-slide-up stagger p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn('flex size-9 items-center justify-center rounded-lg', tint)}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
    </Card>
  )
}

function StatusBars({
  byStatus,
  total,
}: {
  byStatus: DashboardSummary['byStatus']
  total: number
}) {
  return (
    <ul className="space-y-3.5">
      {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((status, i) => {
        const count = byStatus[status] ?? 0
        const { label, tone } = APPLICATION_STATUS[status]
        const percent = total ? Math.round((count / total) * 100) : 0
        return (
          <li key={status}>
            <Link to={links.applications({ status })} className="group block space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-600 transition-colors group-hover:text-slate-900">
                  {label}
                </span>
                <span className="font-medium tabular-nums">
                  {count}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">{percent}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${percent}%`, animationDelay: `${i * 60}ms` }}
                  className={cn(
                    'animate-grow-x h-full origin-left rounded-full transition-[filter] group-hover:brightness-95',
                    STATUS_BAR[tone],
                  )}
                />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
