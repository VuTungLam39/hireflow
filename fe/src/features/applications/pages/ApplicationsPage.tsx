import { CalendarDays, CircleAlert, Gauge } from 'lucide-react'
import { Link } from 'react-router'
import { DataTable, FilterBar, PageHeader, SearchInput, type Column } from '@/components/shared'
import { Avatar, Card, ChipGroup, Input, Select, TONE_DOT } from '@/components/ui'
import { useJobOptions } from '@/features/jobs'
import { useListParams } from '@/hooks/use-list-params'
import { cn, formatDateTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import {
  AiStatusBadge,
  ApplicationStatusBadge,
  ScoreFlags,
  ScoreValue,
} from '../components/StatusBadges'
import { APPLICATION_STATUS, APPLICATION_STATUSES } from '../constants'
import { useApplications } from '../hooks/use-applications'
import { applicationListSchema } from '../schemas/application.schema'
import type { ApplicationListItem } from '../types'

const columns: Column<ApplicationListItem>[] = [
  {
    key: 'candidate',
    header: 'Ứng viên',
    cell: (a) => (
      <div className="flex items-center gap-3">
        <Avatar name={a.candidate.fullName} size="sm" className="hidden md:inline-flex" />
        <div className="min-w-0">
          <Link
            to={links.applicationDetail(a.id)}
            className="hover:text-primary font-medium transition-colors"
          >
            {a.candidate.fullName}
          </Link>
          <p className="text-xs text-slate-500">{a.candidate.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'job',
    header: 'Vị trí',
    cell: (a) => <span className="text-slate-600">{a.job.title}</span>,
  },
  {
    key: 'score',
    header: 'Điểm',
    sortKey: 'score',
    cell: (a) =>
      a.aiStatus === 'DONE' ? (
        <ScoreValue score={a.score} />
      ) : (
        <AiStatusBadge status={a.aiStatus} />
      ),
  },
  { key: 'flags', header: 'Cờ', cell: (a) => <ScoreFlags flags={a.flags} compact /> },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (a) => <ApplicationStatusBadge status={a.status} />,
  },
  {
    key: 'createdAt',
    header: 'Ngày nộp',
    sortKey: 'createdAt',
    cell: (a) => (
      <span className="whitespace-nowrap text-slate-500">{formatDateTime(a.createdAt)}</span>
    ),
  },
]

const statusOptions = APPLICATION_STATUSES.map((value) => ({
  value,
  label: APPLICATION_STATUS[value].label,
  dotClass: TONE_DOT[APPLICATION_STATUS[value].tone],
}))

/** Bảng application có lọc, sắp xếp, phân trang (US-06). Bộ lọc nằm trên URL. */
export default function ApplicationsPage() {
  const [params, setParams] = useListParams(applicationListSchema)
  const query = useApplications(params)
  const jobs = useJobOptions()

  const hasFilter = !!(
    params.search ||
    params.jobId ||
    params.status ||
    params.scoreMin != null ||
    params.scoreMax != null ||
    params.missingMust ||
    params.createdFrom ||
    params.createdTo
  )

  const parseScore = (value: string) => (value === '' ? null : Number(value))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ ứng tuyển"
        description="Điểm do hệ thống tính theo tiêu chí của job, mỗi tiêu chí có bằng chứng trích từ CV."
        actions={
          query.data && (
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900 tabular-nums">
                {query.data.meta.totalItems}
              </span>{' '}
              hồ sơ{hasFilter && ' khớp bộ lọc'}
            </span>
          )
        }
      />

      <Card className="space-y-4">
        <FilterBar
          onReset={
            hasFilter
              ? () =>
                  setParams({
                    search: null,
                    jobId: null,
                    status: null,
                    scoreMin: null,
                    scoreMax: null,
                    missingMust: null,
                    createdFrom: null,
                    createdTo: null,
                  })
              : undefined
          }
        >
          <SearchInput
            value={params.search}
            onChange={(search) => setParams({ search })}
            placeholder="Tên hoặc email ứng viên..."
          />
          <Select
            aria-label="Lọc theo job"
            className="w-56"
            value={params.jobId ?? ''}
            onChange={(e) => setParams({ jobId: e.target.value || null })}
          >
            <option value="">Tất cả job</option>
            {jobs.data?.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </Select>
          <fieldset className="flex w-full min-w-0 items-center gap-1.5 text-sm text-slate-500 sm:w-auto">
            <legend className="sr-only">Ngày nộp</legend>
            <CalendarDays className="size-4 text-slate-400" />
            <Input
              aria-label="Nộp từ ngày"
              type="date"
              className="min-w-0 flex-1 sm:w-38 sm:flex-none"
              max={params.createdTo}
              value={params.createdFrom ?? ''}
              onChange={(e) => setParams({ createdFrom: e.target.value || null })}
            />
            <span>–</span>
            <Input
              aria-label="Nộp đến ngày"
              type="date"
              className="min-w-0 flex-1 sm:w-38 sm:flex-none"
              min={params.createdFrom}
              value={params.createdTo ?? ''}
              onChange={(e) => setParams({ createdTo: e.target.value || null })}
            />
          </fieldset>
          <fieldset className="flex items-center gap-1.5 text-sm text-slate-500">
            <legend className="sr-only">Khoảng điểm</legend>
            <Gauge className="size-4 text-slate-400" />
            <Input
              aria-label="Điểm từ"
              type="number"
              min={0}
              max={100}
              className="w-18"
              placeholder="0"
              defaultValue={params.scoreMin}
              key={`min-${params.scoreMin}`}
              onBlur={(e) => setParams({ scoreMin: parseScore(e.target.value) })}
            />
            <span>–</span>
            <Input
              aria-label="Điểm đến"
              type="number"
              min={0}
              max={100}
              className="w-18"
              placeholder="100"
              defaultValue={params.scoreMax}
              key={`max-${params.scoreMax}`}
              onBlur={(e) => setParams({ scoreMax: parseScore(e.target.value) })}
            />
          </fieldset>
        </FilterBar>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChipGroup
            label="Lọc theo trạng thái"
            options={statusOptions}
            value={params.status}
            onChange={(status) => setParams({ status: status ?? null })}
          />
          <button
            type="button"
            aria-pressed={!!params.missingMust}
            onClick={() => setParams({ missingMust: params.missingMust ? null : 'true' })}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
              params.missingMust
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            <CircleAlert className="size-3.5" />
            Thiếu tiêu chí bắt buộc
          </button>
        </div>

        <DataTable
          columns={columns}
          data={query.data?.items}
          rowKey={(a) => a.id}
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
          isFetching={query.isFetching && !query.isPending}
          emptyTitle="Không có hồ sơ nào"
          emptyDescription={hasFilter ? 'Thử bỏ bớt bộ lọc.' : undefined}
          sort={{
            sortBy: params.sortBy,
            order: params.order,
            onChange: (sortBy, order) =>
              setParams({ sortBy: sortBy as typeof params.sortBy, order }),
          }}
          meta={query.data?.meta}
          onPageChange={(page) => setParams({ page })}
        />
      </Card>
    </div>
  )
}
