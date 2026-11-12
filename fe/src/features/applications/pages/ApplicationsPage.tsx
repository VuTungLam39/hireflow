import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Can,
  ConfirmDialog,
  DataTable,
  DensityToggle,
  FilterBar,
  FilterMenu,
  DateRangeFilter,
  PageHeader,
  SearchInput,
  Summary,
  type ActiveFilter,
  type Column,
} from '@/components/shared'
import { Avatar, Button, Popover, Tabs, menuItemClass } from '@/components/ui'
import { useJobOptions } from '@/features/jobs'
import { useDensity } from '@/hooks/use-density'
import { useListParams } from '@/hooks/use-list-params'
import { Permission } from '@/lib/permissions'
import { formatDate, formatDateTime, formatTime } from '@/lib/utils'
import { links } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
import { CompareDialog } from '../components/CompareDialog'
import { HrUploadDialog } from '../components/HrUploadDialog'
import { QuickView } from '../components/QuickView'
import { AiStatusBadge, ScoreBadge, ScoreFlags, StatusPill } from '../components/StatusBadges'
import {
  AI_STATUS,
  APPLICATION_STATUS,
  APPLICATION_STATUSES,
  APPLICATION_VIEWS,
  NEXT_STATUS,
  REJECT_REASONS,
  SCORE_FAIR,
  SCORE_GOOD,
  type ApplicationStatus,
} from '../constants'
import { applicationQueries, useApplications, useBulkChangeStatus } from '../hooks/use-applications'
import { useMyFeedback } from '../hooks/use-my-feedback'
import { MyFeedbackStatus } from '../components/MyFeedbackStatus'
import { ExportCsvButton } from '../components/ExportCsvButton'
import type { ReviewState } from '../hooks/use-review-navigation'
import { applicationListSchema, type ApplicationListParams } from '../schemas/application.schema'
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
  'bucket',
  'createdFrom',
  'createdTo',
] as const

// US-06 · Design Spec 6.4
const REJECTABLE_IN_BULK: readonly ApplicationStatus[] = ['NEW', 'SCREENING', 'INTERVIEW']

export default function ApplicationsPage() {
  const [params, setParams] = useListParams(applicationListSchema)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = useApplications(params)
  const jobs = useJobOptions()
  const [density, setDensity] = useDensity()
  const isInterviewer = useAuthStore((s) => s.user?.role === Role.Interviewer)
  const myFeedback = useMyFeedback(isInterviewer)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [peek, setPeek] = useState<string | null>(null)
  const [compare, setCompare] = useState<{ jobId: string; ids: string[] } | null>(null)
  const bulk = useBulkChangeStatus()
  const [rejectOpen, setRejectOpen] = useState(false)
  const scope = { jobId: params.jobId, search: params.search }
  const viewCounts = {
    new: useViewCount({ ...scope, status: 'NEW' }, !isInterviewer),
    failed: useViewCount({ ...scope, aiStatus: 'FAILED' }, !isInterviewer),
  }

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
    params.bucket === 'other' && {
      key: 'bucket',
      label: `Dưới ${SCORE_GOOD} điểm hoặc chưa chấm, không thiếu tiêu chí`,
      onRemove: () => setParams({ bucket: null }),
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
  // F3: so sánh 2–3 hồ sơ của cùng một tin
  const compareJobId =
    selectedItems.length >= 2 &&
    selectedItems.length <= 3 &&
    selectedItems.every((a) => a.job.id === selectedItems[0].job.id)
      ? selectedItems[0].job.id
      : null
  const bulkTarget: ApplicationStatus | undefined =
    commonStatus === 'NEW' ? 'SCREENING' : commonStatus === 'SCREENING' ? 'INTERVIEW' : undefined
  // F2 · BR-APP-12: hồ sơ OFFER và đã kết thúc không từ chối theo lô
  const rejectable = selectedItems.filter((a) => REJECTABLE_IN_BULK.includes(a.status))
  const runBulk = (status: ApplicationStatus, reason?: string) =>
    bulk.mutate(
      { ids: selectedItems.map((a) => a.id), status, reason },
      { onSuccess: ({ failed }) => setSelected(new Set(failed.map((f) => f.id))) },
    )

  const columns: Column<ApplicationListItem>[] = [
    {
      key: 'candidate',
      header: 'Ứng viên',
      className: 'w-[32%]',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.candidate.fullName} size="sm" />
          <div className="max-w-64 min-w-0">
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
      ? [
          {
            key: 'myFeedback',
            header: 'Phiếu của bạn',
            cell: (a: ApplicationListItem) => <MyFeedbackStatus value={myFeedback.get(a.id)} />,
          },
        ]
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
      cell: (a) =>
        density === 'compact' ? (
          <span className="type-caption whitespace-nowrap">{formatDateTime(a.createdAt)}</span>
        ) : (
          <span className="block text-[13px] leading-5 whitespace-nowrap">
            <span className="text-ink-2 block">{formatDate(a.createdAt)}</span>
            <span className="text-ink-muted block">{formatTime(a.createdAt)}</span>
          </span>
        ),
    },
  ]

  // App Screens 7.1, 7.4
  const mobileRow = (a: ApplicationListItem) => (
    <div className="flex gap-3">
      <Avatar name={a.candidate.fullName} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-ink truncate font-medium">{a.candidate.fullName}</p>
          {isInterviewer ? (
            <span className="shrink-0">
              <MyFeedbackStatus value={myFeedback.get(a.id)} />
            </span>
          ) : (
            <ScoreBadge score={a.score} className="shrink-0" />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <p className="type-caption truncate">{a.job.title}</p>
          <span className="type-caption num shrink-0">{formatDate(a.createdAt)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <StatusPill status={a.status} />
          {a.aiStatus !== 'DONE' && <AiStatusBadge status={a.aiStatus} />}
          {!isInterviewer && a.flags.length > 0 && <ScoreFlags flags={a.flags} compact />}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ ứng tuyển"
        description={
          query.data && (
            <Summary
              items={[
                `${query.data.meta.totalItems.toLocaleString('vi-VN')} hồ sơ${active.length || params.search ? ' khớp bộ lọc' : ''}`,
              ]}
            />
          )
        }
        actions={
          <>
            {!isInterviewer && (
              <ExportCsvButton params={params} total={query.data?.meta.totalItems} />
            )}
            <Can permission={Permission.ApplicationCreate}>
              <UploadForJob jobs={jobs.data ?? []} preferredJobId={params.jobId} />
            </Can>
          </>
        }
      />

      {!isInterviewer && (
        <Tabs
          label="Bộ lọc đã lưu"
          tabs={APPLICATION_VIEWS.map((v) => ({
            id: v.id,
            label: v.label,
            count: v.id === 'new' || v.id === 'failed' ? viewCounts[v.id] : undefined,
            tone: v.id === 'new' ? 'marker' : v.id === 'failed' ? 'bad' : undefined,
          }))}
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
        <DateRangeFilter
          label="Ngày nộp"
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
        mobileRow={mobileRow}
        onRowClick={(a) => setPeek(a.id)}
        onRowOpen={open}
        selection={isInterviewer ? undefined : { selected, onChange: (next) => setSelected(next) }}
        bulkBar={
          peek
            ? undefined
            : (count) => (
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
                        onClick={() => runBulk(bulkTarget)}
                      >
                        Chuyển {selectedItems.length} hồ sơ sang{' '}
                        {APPLICATION_STATUS[bulkTarget].label}
                      </Button>
                    </Can>
                  ) : (
                    <Can permission={Permission.ApplicationUpdateStatus}>
                      <span className="text-[13px] text-white/70">
                        Chọn hồ sơ cùng trạng thái Mới hoặc Sàng lọc để chuyển bước
                      </span>
                    </Can>
                  )}
                  {rejectable.length > 0 && (
                    <Can permission={Permission.ApplicationUpdateStatus}>
                      <Button
                        size="sm"
                        variant="quiet"
                        className="text-white hover:bg-white/10"
                        disabled={bulk.isPending}
                        onClick={() => setRejectOpen(true)}
                      >
                        Từ chối {rejectable.length} hồ sơ
                      </Button>
                    </Can>
                  )}
                  {compareJobId && (
                    <Button
                      size="sm"
                      variant="quiet"
                      className="text-white hover:bg-white/10"
                      onClick={() =>
                        setCompare({ jobId: compareJobId, ids: selectedItems.map((a) => a.id) })
                      }
                    >
                      So sánh {selectedItems.length} hồ sơ
                    </Button>
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
              )
        }
      />

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Từ chối ${rejectable.length} hồ sơ?`}
        description={
          rejectable.length < selectedItems.length
            ? `Lý do dùng chung cho ${rejectable.length} hồ sơ. ${selectedItems.length - rejectable.length} hồ sơ ở bước Đề nghị hoặc đã kết thúc sẽ được bỏ qua.`
            : `Lý do dùng chung cho ${rejectable.length} hồ sơ và được ghi vào lịch sử từng hồ sơ.`
        }
        confirmLabel={`Từ chối ${rejectable.length} hồ sơ`}
        tone="danger"
        requireReason={{
          label: 'Lý do',
          placeholder: 'Ví dụ: chưa đủ kinh nghiệm NestJS',
          suggestions: REJECT_REASONS,
        }}
        loading={bulk.isPending}
        onConfirm={(reason) => {
          runBulk('REJECTED', reason)
          setRejectOpen(false)
        }}
      />

      {compare && (
        <CompareDialog
          open
          jobId={compare.jobId}
          ids={compare.ids}
          onClose={() => setCompare(null)}
        />
      )}

      <QuickView
        id={peek}
        listQuery={listQuery}
        hideScore={isInterviewer}
        onClose={() => setPeek(null)}
      />
    </div>
  )
}

// Số trên tab = số hồ sơ sẽ thấy khi bấm tab, cùng phạm vi tin và ô tìm
function useViewCount(filter: Partial<ApplicationListParams>, enabled: boolean) {
  const query = useQuery({
    ...applicationQueries.list({
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      order: 'DESC',
      ...filter,
    }),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  return query.data?.meta.totalItems
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
