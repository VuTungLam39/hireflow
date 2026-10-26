import { Building2, MapPin, Megaphone, Plus, Sparkles, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import {
  Can,
  ConfirmDialog,
  DataTable,
  FilterBar,
  PageHeader,
  SearchInput,
  type Column,
} from '@/components/shared'
import { Button, buttonVariants, Card, ChipGroup, Select, TONE_DOT } from '@/components/ui'
import { useDepartmentOptions } from '@/features/departments'
import { useListParams } from '@/hooks/use-list-params'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate, formatRelative } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { PipelineBar } from '../components/PipelineBar'
import { JOB_STATUS, type JobStatus } from '../constants'
import { useCloseJob, useJobs, usePublishJob } from '../hooks/use-jobs'
import { jobListSchema } from '../schemas/job.schema'
import type { JobSummary } from '../types'

type PendingAction = { type: 'publish' | 'close'; job: JobSummary } | null

const statusOptions = (Object.keys(JOB_STATUS) as JobStatus[]).map((value) => ({
  value,
  label: JOB_STATUS[value].label,
  dotClass: TONE_DOT[JOB_STATUS[value].tone],
}))

export default function JobsPage() {
  const [params, setParams] = useListParams(jobListSchema)
  const query = useJobs(params)
  const departments = useDepartmentOptions()
  const canUpdate = usePermission(Permission.JobUpdate)
  const publish = usePublishJob()
  const close = useCloseJob()
  const [pending, setPending] = useState<PendingAction>(null)

  const hasFilter = !!(params.search || params.status || params.departmentId)

  const columns: Column<JobSummary>[] = [
    {
      key: 'title',
      header: 'Vị trí',
      sortKey: 'title',
      cell: (job) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={canUpdate ? links.jobEdit(job.id) : links.jobRanking(job.id)}
              className="hover:text-primary font-medium text-slate-900 transition-colors"
            >
              {job.title}
            </Link>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" />
              {job.department.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {job.location}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: 'pipeline',
      header: 'Hồ sơ',
      cell: (job) => (
        <Link
          to={links.applications({ jobId: job.id })}
          className="group flex items-center gap-3"
          aria-label={`Xem ${job.applicationCount} hồ sơ của ${job.title}`}
        >
          <span className="group-hover:text-primary w-8 text-lg font-semibold text-slate-900 tabular-nums transition-colors">
            {job.applicationCount}
          </span>
          <PipelineBar pipeline={job.pipeline} total={job.applicationCount} />
        </Link>
      ),
    },
    {
      key: 'publishedAt',
      header: 'Ngày đăng',
      sortKey: 'publishedAt',
      cell: (job) =>
        job.publishedAt ? (
          <span className="text-slate-600" title={formatDate(job.publishedAt)}>
            {formatRelative(job.publishedAt)}
          </span>
        ) : (
          <span className="text-slate-400">Chưa đăng</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      isAction: true,
      className: 'text-right whitespace-nowrap',
      cell: (job) => (
        <div className="inline-flex gap-1">
          <Link
            to={links.jobRanking(job.id)}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <Trophy />
            Xếp hạng
          </Link>
          <Can permission={Permission.ApplicationCreate}>
            {job.status !== 'DRAFT' && (
              <Link
                to={links.jobMatches(job.id)}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                <Sparkles />
                Gợi ý
              </Link>
            )}
          </Can>
          <Can permission={Permission.JobPublish}>
            {job.status === 'DRAFT' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => setPending({ type: 'publish', job })}
              >
                <Megaphone />
                Đăng tin
              </Button>
            )}
            {job.status === 'OPEN' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-600"
                onClick={() => setPending({ type: 'close', job })}
              >
                <X />
                Đóng
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ]

  const action = pending?.type === 'publish' ? publish : close

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tuyển dụng"
        description="Tạo job từ JD, để AI gợi ý tiêu chí, chỉnh lại rồi đăng. Thanh màu cho biết hồ sơ của mỗi job đang ở đâu."
        actions={
          <Can permission={Permission.JobCreate}>
            <Link to={paths.jobNew} className={buttonVariants()}>
              <Plus />
              Tạo job
            </Link>
          </Can>
        }
      />

      <Card className="space-y-4">
        <FilterBar
          onReset={
            hasFilter
              ? () => setParams({ search: null, status: null, departmentId: null })
              : undefined
          }
        >
          <SearchInput
            value={params.search}
            onChange={(search) => setParams({ search })}
            placeholder="Tìm theo tiêu đề..."
          />
          <Select
            aria-label="Lọc theo phòng ban"
            className="w-48"
            value={params.departmentId ?? ''}
            onChange={(e) => setParams({ departmentId: e.target.value || null })}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FilterBar>
        <ChipGroup
          label="Lọc theo trạng thái"
          options={statusOptions}
          value={params.status}
          onChange={(status) => setParams({ status: status ?? null })}
        />

        <DataTable
          columns={columns}
          data={query.data?.items}
          rowKey={(job) => job.id}
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
          isFetching={query.isFetching && !query.isPending}
          emptyTitle="Chưa có tin tuyển dụng"
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

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.type === 'publish' ? 'Đăng tin tuyển dụng?' : 'Đóng tin tuyển dụng?'}
        description={
          pending?.type === 'publish'
            ? `"${pending.job.title}" sẽ hiện ngay trên trang tuyển dụng công khai.`
            : `"${pending?.job.title}" sẽ không nhận thêm hồ sơ.`
        }
        confirmLabel={pending?.type === 'publish' ? 'Đăng tin' : 'Đóng tin'}
        tone={pending?.type === 'close' ? 'danger' : 'primary'}
        loading={action.isPending}
        onConfirm={() =>
          pending && action.mutate(pending.job.id, { onSettled: () => setPending(null) })
        }
      />
    </div>
  )
}
