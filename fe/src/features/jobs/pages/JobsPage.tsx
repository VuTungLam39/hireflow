import { MoreHorizontal, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Can,
  ConfirmDialog,
  DataTable,
  DensityToggle,
  FilterBar,
  FilterMenu,
  PageHeader,
  SearchInput,
  Summary,
  type ActiveFilter,
  type Column,
} from '@/components/shared'
import { Button, Popover, Tabs, buttonVariants, menuItemClass } from '@/components/ui'
import { useDepartmentOptions } from '@/features/departments'
import { useDensity } from '@/hooks/use-density'
import { useListParams } from '@/hooks/use-list-params'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { PipelineCounts } from '../components/PipelineBar'
import { JOB_STATUS, type JobStatus } from '../constants'
import { useCloseJob, useJobs, usePublishJob } from '../hooks/use-jobs'
import { jobListSchema } from '../schemas/job.schema'
import type { JobSummary } from '../types'

type PendingAction = { type: 'publish' | 'close'; job: JobSummary } | null

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'OPEN', label: 'Đang tuyển' },
  { id: 'DRAFT', label: 'Nháp' },
  { id: 'CLOSED', label: 'Đã đóng' },
] as const

const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

// F-JOB-01 · Design Spec 6.5
export default function JobsPage() {
  const [params, setParams] = useListParams(jobListSchema)
  const query = useJobs(params)
  const departments = useDepartmentOptions()
  const canUpdate = usePermission(Permission.JobUpdate)
  const navigate = useNavigate()
  const [density, setDensity] = useDensity()
  const [pending, setPending] = useState<PendingAction>(null)
  const publish = usePublishJob()
  const close = useCloseJob()
  const action = pending?.type === 'publish' ? publish : close

  const dept = departments.data?.find((d) => d.id === params.departmentId)
  const active: ActiveFilter[] = dept
    ? [
        {
          key: 'dept',
          label: `Phòng ban: ${dept.name}`,
          onRemove: () => setParams({ departmentId: null }),
        },
      ]
    : []

  const openTarget = (job: JobSummary) =>
    job.status === 'DRAFT' && canUpdate ? links.jobEdit(job.id) : links.jobRanking(job.id)

  const columns: Column<JobSummary>[] = [
    {
      key: 'title',
      header: 'Tin',
      sortKey: 'title',
      cell: (job) => (
        <div className="min-w-0">
          <Link
            to={openTarget(job)}
            className="text-ink hover:text-brand font-semibold transition-colors"
          >
            {job.title}
          </Link>
          <p className="type-caption truncate">
            {job.department.name} · {job.location}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      hideOnMobile: true,
      cell: (job) => <JobStatusBadge status={job.status} />,
    },
    {
      key: 'pipeline',
      header: 'Hồ sơ theo bước',
      cell: (job) => (
        <PipelineCounts pipeline={job.pipeline} total={job.applicationCount} jobId={job.id} />
      ),
    },
    {
      key: 'publishedAt',
      header: 'Đã đăng',
      sortKey: 'publishedAt',
      align: 'right',
      cell: (job) =>
        job.publishedAt ? (
          <span className="type-caption num" title={formatDate(job.publishedAt)}>
            {daysSince(job.publishedAt) === 0 ? 'hôm nay' : `${daysSince(job.publishedAt)} ngày`}
          </span>
        ) : (
          <span className="type-caption">Chưa đăng</span>
        ),
    },
  ]

  const counts = query.data?.meta.totalItems

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tuyển dụng"
        description={
          counts !== undefined && (
            <Summary
              items={[
                `${counts.toLocaleString('vi-VN')} tin${params.status ? ` ${JOB_STATUS[params.status].label.toLowerCase()}` : ''}`,
              ]}
            />
          )
        }
        actions={
          <Can permission={Permission.JobCreate}>
            <Link to={paths.jobNew} className={buttonVariants()}>
              <Plus />
              Tạo tin
            </Link>
          </Can>
        }
      />

      <Tabs
        label="Lọc theo trạng thái tin"
        tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
        value={params.status ?? 'all'}
        onChange={(id) => setParams({ status: id === 'all' ? null : (id as JobStatus) })}
      />

      <FilterBar
        active={active}
        onReset={active.length ? () => setParams({ departmentId: null }) : undefined}
        trailing={<DensityToggle value={density} onChange={setDensity} />}
      >
        <SearchInput
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Tìm theo tên tin"
          label="Tìm theo tên tin"
        />
        <FilterMenu
          label="Phòng ban"
          value={params.departmentId}
          options={(departments.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          onChange={(departmentId) => setParams({ departmentId: departmentId ?? null })}
        />
      </FilterBar>

      <DataTable
        caption="Danh sách tin tuyển dụng"
        columns={columns}
        data={query.data?.items}
        rowKey={(job) => job.id}
        rowLabel={(job) => job.title}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        density={density}
        onRowOpen={(job) => void navigate(openTarget(job))}
        rowActions={(job) => <RowMenu job={job} onAction={setPending} />}
        emptyTitle={
          params.search || params.status || dept
            ? 'Không có tin khớp bộ lọc'
            : 'Chưa có tin tuyển dụng'
        }
        emptyDescription={
          params.search || params.status || dept
            ? 'Thử đổi tab hoặc bỏ bớt điều kiện lọc.'
            : 'Tạo tin từ mô tả công việc, đặt tiêu chí chấm rồi đăng để bắt đầu nhận hồ sơ.'
        }
        emptyAction={
          <Can permission={Permission.JobCreate}>
            <Link to={paths.jobNew} className={buttonVariants({ variant: 'secondary' })}>
              Tạo tin
            </Link>
          </Can>
        }
        sort={{
          sortBy: params.sortBy,
          order: params.order,
          onChange: (sortBy, order) => setParams({ sortBy: sortBy as typeof params.sortBy, order }),
        }}
        meta={query.data?.meta}
        onPageChange={(page) => setParams({ page })}
      />

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.type === 'publish' ? 'Đăng tin tuyển dụng?' : 'Đóng tin tuyển dụng?'}
        description={
          pending?.type === 'publish'
            ? `“${pending.job.title}” sẽ hiện ngay trên trang tuyển dụng công khai.`
            : `“${pending?.job.title}” sẽ ngừng nhận hồ sơ mới; hồ sơ đã có vẫn xử lý bình thường. Tin đã đóng không mở lại được.`
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

function RowMenu({ job, onAction }: { job: JobSummary; onAction: (a: PendingAction) => void }) {
  const [open, setOpen] = useState(false)
  const canUpdate = usePermission(Permission.JobUpdate)
  const canPublish = usePermission(Permission.JobPublish)
  const canInvite = usePermission(Permission.ApplicationCreate)
  const go = () => setOpen(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      role="menu"
      label={`Thao tác với ${job.title}`}
      className="w-60"
      trigger={(props) => (
        <Button variant="quiet" size="icon-sm" aria-label={`Thao tác với ${job.title}`} {...props}>
          <MoreHorizontal />
        </Button>
      )}
    >
      <Link role="menuitem" to={links.jobEdit(job.id)} className={menuItemClass} onClick={go}>
        <Pencil />
        {canUpdate && job.status !== 'CLOSED' ? 'Sửa tin và tiêu chí' : 'Xem tin và tiêu chí'}
      </Link>
      <Link role="menuitem" to={links.jobRanking(job.id)} className={menuItemClass} onClick={go}>
        Xếp hạng ứng viên
      </Link>
      <Link
        role="menuitem"
        to={links.applications({ jobId: job.id })}
        className={menuItemClass}
        onClick={go}
      >
        Bảng hồ sơ của tin
      </Link>
      {canInvite && job.status !== 'DRAFT' && (
        <Link role="menuitem" to={links.jobMatches(job.id)} className={menuItemClass} onClick={go}>
          Ứng viên cũ phù hợp
        </Link>
      )}
      {canPublish && job.status === 'DRAFT' && (
        <button
          type="button"
          role="menuitem"
          className={menuItemClass}
          onClick={() => {
            go()
            onAction({ type: 'publish', job })
          }}
        >
          Đăng tin
        </button>
      )}
      {canPublish && job.status === 'OPEN' && (
        <>
          <div className="border-line-soft my-1 border-t" />
          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} text-bad hover:text-bad`}
            onClick={() => {
              go()
              onAction({ type: 'close', job })
            }}
          >
            Đóng tin
          </button>
        </>
      )}
    </Popover>
  )
}
