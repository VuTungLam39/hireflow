import { DeadlineTag } from '../components/DeadlineTag'
import {
  Copy,
  Inbox,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  UserSearch,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
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
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { useDensity } from '@/hooks/use-density'
import { useDetailLink, useOpenDetail } from '@/hooks/use-detail'
import { useListParams } from '@/hooks/use-list-params'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { formatDate, formatDaysAgo } from '@/lib/utils'
import { JobStatusBadge } from '../components/JobStatusBadge'
import { PipelineCounts } from '../components/PipelineBar'
import { JOB_STATUS, type JobStatus } from '../constants'
import { useCloneJob, useCloseJob, useJobs, usePublishJob } from '../hooks/use-jobs'
import { jobListSchema } from '../schemas/job.schema'
import type { JobSummary } from '../types'

type PendingAction = { type: 'publish' | 'close'; job: JobSummary } | null

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'OPEN', label: 'Đang tuyển' },
  { id: 'DRAFT', label: 'Nháp' },
  { id: 'CLOSED', label: 'Đã đóng' },
] as const

// App Screens 7.1, 7.4
function JobMobileRow({ job }: { job: JobSummary }) {
  const newCount = job.pipeline.new
  return (
    <div className="min-w-0">
      <p className="text-ink truncate font-semibold">{job.title}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-3">
        <p className="type-caption truncate">
          {job.department.name} · {job.location}
        </p>
        {job.status !== 'DRAFT' && (
          <span className="num shrink-0 text-[13px]">
            <span className={job.applicationCount ? 'text-ink font-semibold' : 'text-ink-faint'}>
              {job.applicationCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-ink-muted"> hồ sơ</span>
            {newCount > 0 && (
              <span className="bg-marker text-ink ml-1.5 rounded-xs px-1 font-medium">
                {newCount.toLocaleString('vi-VN')} mới
              </span>
            )}
          </span>
        )}
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <JobStatusBadge status={job.status} />
        <span className="type-caption">
          · {job.publishedAt ? `đăng ${formatDaysAgo(job.publishedAt)}` : 'chưa đăng'}
        </span>
      </p>
      <DeadlineTag job={job} className="mt-1 block" />
    </div>
  )
}

// F-JOB-01 · Design Spec 6.5
export default function JobsPage() {
  const [params, setParams] = useListParams(jobListSchema)
  const departments = useDepartmentOptions()
  const ownDepartmentOnly = useAuthStore((s) => s.user?.role === Role.HiringManager)
  const query = useJobs(ownDepartmentOnly ? { ...params, departmentId: undefined } : params)
  const detailLink = useDetailLink()
  const openDetail = useOpenDetail()
  const [density, setDensity] = useDensity()
  const [pending, setPending] = useState<PendingAction>(null)
  const publish = usePublishJob()
  const close = useCloseJob()
  const action = pending?.type === 'publish' ? publish : close

  const dept = ownDepartmentOnly
    ? undefined
    : departments.data?.find((d) => d.id === params.departmentId)
  const active: ActiveFilter[] = dept
    ? [
        {
          key: 'dept',
          label: `Phòng ban: ${dept.name}`,
          onRemove: () => setParams({ departmentId: null }),
        },
      ]
    : []

  const columns: Column<JobSummary>[] = [
    {
      key: 'title',
      header: 'Tin',
      sortKey: 'title',
      cell: (job) => (
        <div className="min-w-0">
          <Link
            to={detailLink('job', job.id)}
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
      cell: (job) => (
        <div className="flex flex-col items-start gap-0.5">
          <JobStatusBadge status={job.status} />
          <DeadlineTag job={job} />
        </div>
      ),
    },
    {
      key: 'pipeline',
      header: 'Hồ sơ',
      align: 'right',
      className: 'w-60',
      cell: (job) =>
        job.status === 'DRAFT' ? (
          <span className="text-ink-faint" title="Tin nháp chưa nhận hồ sơ">
            —
          </span>
        ) : (
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
            {formatDaysAgo(job.publishedAt)}
          </span>
        ) : (
          <span className="type-caption">chưa đăng</span>
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
            <Link to={detailLink('job', 'new')} className={buttonVariants()}>
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
        {!ownDepartmentOnly && (
          <FilterMenu
            label="Phòng ban"
            value={params.departmentId}
            options={(departments.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
            onChange={(departmentId) => setParams({ departmentId: departmentId ?? null })}
          />
        )}
      </FilterBar>

      <DataTable
        caption="Danh sách tin tuyển dụng"
        columns={columns}
        data={query.data?.items}
        rowKey={(job) => job.id}
        rowLabel={(job) => job.title}
        mobileRow={(job) => <JobMobileRow job={job} />}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        density={density}
        onRowClick={(job) => openDetail('job', job.id)}
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
            <Link
              to={detailLink('job', 'new')}
              className={buttonVariants({ variant: 'secondary' })}
            >
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
  const canCreate = usePermission(Permission.JobCreate)
  const clone = useCloneJob()
  const detailLink = useDetailLink()
  const editable = canUpdate && job.status !== 'CLOSED'
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
      <Link
        role="menuitem"
        to={detailLink('job', job.id, 'content')}
        className={menuItemClass}
        onClick={go}
      >
        <Pencil />
        {editable ? 'Sửa nội dung tin' : 'Xem nội dung tin'}
      </Link>
      <Link
        role="menuitem"
        to={detailLink('job', job.id, 'criteria')}
        className={menuItemClass}
        onClick={go}
      >
        <ListChecks />
        {editable ? 'Sửa tiêu chí chấm' : 'Xem tiêu chí chấm'}
      </Link>
      {canCreate && (
        <button
          type="button"
          role="menuitem"
          className={menuItemClass}
          disabled={clone.isPending}
          onClick={() => {
            go()
            clone.mutate(job.id)
          }}
        >
          <Copy />
          Nhân bản thành tin nháp
        </button>
      )}
      {job.status !== 'DRAFT' && (
        <>
          <div className="border-line-soft my-1 border-t" />
          <Link
            role="menuitem"
            to={detailLink('job', job.id, 'applications')}
            className={menuItemClass}
            onClick={go}
          >
            <Inbox />
            Hồ sơ của tin
          </Link>
          <Link
            role="menuitem"
            to={detailLink('job', job.id, 'ranking')}
            className={menuItemClass}
            onClick={go}
          >
            <ListOrdered />
            Xếp hạng ứng viên
          </Link>
          {canInvite && (
            <Link
              role="menuitem"
              to={detailLink('job', job.id, 'matches')}
              className={menuItemClass}
              onClick={go}
            >
              <UserSearch />
              Ứng viên cũ phù hợp
            </Link>
          )}
        </>
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
