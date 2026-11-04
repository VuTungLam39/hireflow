import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Can,
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
import { Avatar, Button, Input, Popover, Tabs, menuItemClass } from '@/components/ui'
import { useJobOptions } from '@/features/jobs'
import { useDensity } from '@/hooks/use-density'
import { useListParams } from '@/hooks/use-list-params'
import { Permission } from '@/lib/permissions'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { HrUploadDialog } from '../components/HrUploadDialog'
import { QuickView } from '../components/QuickView'
import { AiStatusBadge, ScoreBadge, ScoreFlags, StatusPill } from '../components/StatusBadges'
import {
  AI_STATUS,
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  APPLICATION_VIEWS,
  NEXT_STATUS,
  SCORE_FAIR,
  SCORE_GOOD,
  type ApplicationStatus,
} from '../constants'
import { applicationQueries, useApplications, useBulkChangeStatus } from '../hooks/use-applications'
import type { ReviewState } from '../hooks/use-review-navigation'
import { applicationListSchema } from '../schemas/application.schema'
import type { ApplicationListItem } from '../types'

const SCORE_BANDS = [
  { value: 'good', label: `Từ ${SCORE_GOOD}`, min: SCORE_GOOD, max: undefined },
  { value: 'fair', label: `${SCORE_FAIR}–${SCORE_GOOD - 1}`, min: SCORE_FAIR, max: SCORE_GOOD - 1 },
  { value: 'low', label: `Dưới ${SCORE_FAIR}`, min: 0, max: SCORE_FAIR - 1 },
] as const

const FILTER_KEYS = [
  'search',
  'jobId',
  'status',
  'aiStatus',
  'scoreMin',
  'scoreMax',
  'missingMust',
  'createdFrom',
  'createdTo',
] as const

// US-06 · Design Spec 6.4
export default function ApplicationsPage() {
  const [params, setParams] = useListParams(applicationListSchema)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = useApplications(params)
  const jobs = useJobOptions()
  const [density, setDensity] = useDensity()
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [peek, setPeek] = useState<string | null>(null)
  const bulk = useBulkChangeStatus()
  const pending = useQuery({
    ...applicationQueries.list({
      page: 1,
      limit: 1,
      status: 'NEW',
      sortBy: 'createdAt',
      order: 'DESC',
    }),
    enabled: !isInterviewer,
  })

  const listQuery = searchParams.toString()
  const clear = Object.fromEntries(FILTER_KEYS.map((k) => [k, null]))

  const activeView =
    APPLICATION_VIEWS.find((v) => {
      const p = v.params as Record<string, unknown>
      return FILTER_KEYS.filter((k) => k !== 'search' && k !== 'jobId').every(
        (k) => (params[k] ?? undefined) === (p[k] ?? undefined),
      )
    })?.id ?? 'all'

  const jobTitle = jobs.data?.find((j) => j.id === params.jobId)?.title
  const band = SCORE_BANDS.find(
    (b) => b.min === params.scoreMin && (b.max ?? undefined) === (params.scoreMax ?? undefined),
  )

  const active: ActiveFilter[] = [
    params.jobId && {
      key: 'job',
      label: `Tin: ${jobTitle ?? '…'}`,
      onRemove: () => setParams({ jobId: null }),
    },
    params.status && {
      key: 'status',
      label: `Trạng thái: ${APPLICATION_STATUS[params.status].label}`,
      onRemove: () => setParams({ status: null }),
    },
    params.aiStatus && {
      key: 'ai',
      label: AI_STATUS[params.aiStatus].label,
      onRemove: () => setParams({ aiStatus: null }),
    },
    (params.scoreMin != null || params.scoreMax != null) && {
      key: 'score',
      label: `Mức phù hợp: ${band?.label ?? `${params.scoreMin ?? 0}–${params.scoreMax ?? 100}`}`,
      onRemove: () => setParams({ scoreMin: null, scoreMax: null }),
    },
    params.missingMust && {
      key: 'must',
      label: 'Thiếu tiêu chí bắt buộc',
      onRemove: () => setParams({ missingMust: null }),
    },
    (params.createdFrom || params.createdTo) && {
      key: 'date',
      label:
        `Nộp ${params.createdFrom ? `từ ${formatDate(params.createdFrom)}` : ''} ${params.createdTo ? `đến ${formatDate(params.createdTo)}` : ''}`.trim(),
      onRemove: () => setParams({ createdFrom: null, createdTo: null }),
    },
  ].filter((f): f is ActiveFilter => !!f)

  const open = (a: ApplicationListItem) =>
    void navigate(links.applicationDetail(a.id), {
      state: { listQuery } satisfies ReviewState,
    })

  const items = query.data?.items
  const selectedItems = useMemo(
    () => (items ?? []).filter((a) => selected.has(a.id)),
    [items, selected],
  )
  const commonStatus = selectedItems.every((a) => a.status === selectedItems[0]?.status)
    ? selectedItems[0]?.status
    : undefined
  const bulkTarget: ApplicationStatus | undefined =
    commonStatus === 'NEW' ? 'SCREENING' : commonStatus === 'SCREENING' ? 'INTERVIEW' : undefined

  const columns: Column<ApplicationListItem>[] = [
    {
      key: 'candidate',
      header: 'Ứng viên',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.candidate.fullName} size="sm" />
          <div className="min-w-0">
            <p className="text-ink truncate font-medium">{a.candidate.fullName}</p>
            <p className="type-caption truncate">{a.candidate.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Tin',
      hideOnMobile: true,
      cell: (a) => <span className="text-ink-2 line-clamp-1">{a.job.title}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (a) => (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <StatusPill status={a.status} />
          {a.aiStatus !== 'DONE' && <AiStatusBadge status={a.aiStatus} />}
          {!isInterviewer && a.flags.length > 0 && <ScoreFlags flags={a.flags} compact />}
        </div>
      ),
    },
    ...(isInterviewer
      ? []
      : [
          {
            key: 'score',
            header: 'Mức phù hợp',
            sortKey: 'score',
            align: 'right' as const,
            cell: (a: ApplicationListItem) => <ScoreBadge score={a.score} />,
          },
        ]),
    {
      key: 'createdAt',
      header: 'Nộp lúc',
      sortKey: 'createdAt',
      align: 'right',
      cell: (a) => (
        <span className="type-caption whitespace-nowrap">{formatDateTime(a.createdAt)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ ứng tuyển"
        description={
          query.data && (
            <Summary
              items={[
                `${query.data.meta.totalItems.toLocaleString('vi-VN')} hồ sơ${active.length || params.search ? ' khớp bộ lọc' : ''}`,
                pending.data && `${pending.data.meta.totalItems.toLocaleString('vi-VN')} chờ xem`,
              ]}
            />
          )
        }
        actions={
          <Can permission={Permission.ApplicationCreate}>
            <UploadForJob jobs={jobs.data ?? []} preferredJobId={params.jobId} />
          </Can>
        }
      />

      {!isInterviewer && (
        <Tabs
          label="Bộ lọc đã lưu"
          tabs={APPLICATION_VIEWS.map((v) => ({ id: v.id, label: v.label }))}
          value={activeView}
          onChange={(id) => {
            const view = APPLICATION_VIEWS.find((v) => v.id === id)!
            setParams({ ...clear, search: params.search, jobId: params.jobId, ...view.params })
            setSelected(new Set())
          }}
        />
      )}

      <FilterBar
        active={active}
        onReset={active.length ? () => setParams(clear) : undefined}
        trailing={<DensityToggle value={density} onChange={setDensity} />}
      >
        <SearchInput
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="Tên hoặc email ứng viên"
          label="Tìm theo tên hoặc email ứng viên"
        />
        <FilterMenu
          label="Tin"
          value={params.jobId}
          options={(jobs.data ?? []).map((j) => ({ value: j.id, label: j.title }))}
          onChange={(jobId) => setParams({ jobId: jobId ?? null })}
        />
        <FilterMenu
          label="Trạng thái"
          value={params.status}
          options={APPLICATION_STATUSES.map((s) => ({
            value: s,
            label: APPLICATION_STATUS[s].label,
          }))}
          onChange={(status) => setParams({ status: status ?? null })}
        />
        {!isInterviewer && (
          <FilterMenu
            label="Mức phù hợp"
            value={band?.value}
            options={SCORE_BANDS.map((b) => ({ value: b.value, label: b.label }))}
            onChange={(v) => {
              const b = SCORE_BANDS.find((x) => x.value === v)
              setParams({ scoreMin: b?.min ?? null, scoreMax: b?.max ?? null })
            }}
          />
        )}
        <DateFilter
          from={params.createdFrom}
          to={params.createdTo}
          onChange={(createdFrom, createdTo) =>
            setParams({ createdFrom: createdFrom || null, createdTo: createdTo || null })
          }
        />
      </FilterBar>

      <DataTable
        caption="Danh sách hồ sơ ứng tuyển"
        columns={columns}
        data={items}
        rowKey={(a) => a.id}
        rowLabel={(a) => `${a.candidate.fullName}, ${a.job.title}`}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
        isFetching={query.isFetching && !query.isPending}
        density={density}
        emptyTitle={
          active.length || params.search ? 'Không có hồ sơ khớp bộ lọc' : 'Chưa có hồ sơ nào'
        }
        emptyDescription={
          active.length || params.search
            ? 'Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá.'
            : 'Hồ sơ sẽ hiện ở đây khi ứng viên nộp CV qua trang tuyển dụng hoặc bạn tải CV hộ.'
        }
        emptyAction={
          active.length > 0 && (
            <Button variant="secondary" onClick={() => setParams(clear)}>
              Xoá lọc
            </Button>
          )
        }
        sort={{
          sortBy: params.sortBy,
          order: params.order,
          onChange: (sortBy, order) => setParams({ sortBy: sortBy as typeof params.sortBy, order }),
        }}
        meta={query.data?.meta}
        onPageChange={(page) => {
          setParams({ page })
          setSelected(new Set())
        }}
        activeRowKey={peek ?? undefined}
        onRowClick={(a) => setPeek(a.id)}
        onRowOpen={open}
        selection={isInterviewer ? undefined : { selected, onChange: (next) => setSelected(next) }}
        bulkBar={(count) => (
          <>
            <span className="px-1 text-sm">
              Đã chọn <strong className="text-white">{count}</strong> hồ sơ
            </span>
            {bulkTarget && NEXT_STATUS[commonStatus!].includes(bulkTarget) ? (
              <Can permission={Permission.ApplicationUpdateStatus}>
                <Button
                  size="sm"
                  variant="inverse"
                  loading={bulk.isPending}
                  onClick={() =>
                    bulk.mutate(
                      { ids: selectedItems.map((a) => a.id), status: bulkTarget },
                      { onSuccess: () => setSelected(new Set()) },
                    )
                  }
                >
                  Chuyển {selectedItems.length} hồ sơ sang {APPLICATION_STATUS[bulkTarget].label}
                </Button>
              </Can>
            ) : (
              <span className="text-[13px] text-white/70">
                Chọn hồ sơ cùng trạng thái Mới hoặc Sàng lọc để chuyển bước
              </span>
            )}
            <Button
              size="sm"
              variant="quiet"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setSelected(new Set())}
            >
              Bỏ chọn
            </Button>
          </>
        )}
      />

      <QuickView
        id={peek}
        listQuery={listQuery}
        hideScore={isInterviewer}
        onClose={() => setPeek(null)}
      />
    </div>
  )
}

function DateFilter({
  from,
  to,
  onChange,
}: {
  from?: string
  to?: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const on = !!(from || to)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label="Lọc theo ngày nộp"
      className="w-72 p-3"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-sm whitespace-nowrap transition-colors',
            on
              ? 'border-brand/30 bg-brand-soft text-brand'
              : 'border-line bg-surface text-ink-2 hover:border-ink-faint',
          )}
        >
          <span className={on ? 'text-brand/80' : 'text-ink-muted'}>Ngày nộp:</span>
          <span className="font-medium">{on ? 'Đang lọc' : 'Bất kỳ'}</span>
          <ChevronDown className="size-4 opacity-70" />
        </button>
      )}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="type-label space-y-1">
          Từ ngày
          <Input
            type="date"
            aria-label="Nộp từ ngày"
            max={to}
            value={from ?? ''}
            onChange={(e) => onChange(e.target.value, to ?? '')}
          />
        </label>
        <label className="type-label space-y-1">
          Đến ngày
          <Input
            type="date"
            aria-label="Nộp đến ngày"
            min={from}
            value={to ?? ''}
            onChange={(e) => onChange(from ?? '', e.target.value)}
          />
        </label>
      </div>
    </Popover>
  )
}

function UploadForJob({
  jobs,
  preferredJobId,
}: {
  jobs: { id: string; title: string; status: string }[]
  preferredJobId?: string
}) {
  const [menu, setMenu] = useState(false)
  const [job, setJob] = useState<{ id: string; title: string } | null>(null)
  const openJobs = jobs.filter((j) => j.status === 'OPEN')
  const preferred = openJobs.find((j) => j.id === preferredJobId)

  return (
    <>
      {preferred ? (
        <Button onClick={() => setJob(preferred)}>
          <Upload />
          Tải CV hộ
        </Button>
      ) : (
        <Popover
          open={menu}
          onOpenChange={setMenu}
          align="end"
          role="menu"
          label="Chọn tin để tải CV hộ"
          className="max-h-80 w-72 overflow-y-auto"
          trigger={(props) => (
            <Button {...props} disabled={openJobs.length === 0}>
              <Upload />
              Tải CV hộ
            </Button>
          )}
        >
          <p className="type-overline px-2.5 pt-1.5 pb-1">Tải vào tin đang tuyển</p>
          {openJobs.map((j) => (
            <button
              key={j.id}
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                setMenu(false)
                setJob(j)
              }}
            >
              {j.title}
            </button>
          ))}
        </Popover>
      )}
      {job && (
        <HrUploadDialog jobId={job.id} jobTitle={job.title} open onClose={() => setJob(null)} />
      )}
    </>
  )
}
