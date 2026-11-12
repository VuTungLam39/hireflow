import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Can, EmptyState, ErrorState, PageHeader, SidePanel, Summary } from '@/components/shared'
import { Button, Skeleton, buttonVariants } from '@/components/ui'
import {
  applicationQueries,
  CompareDialog,
  MatchIndicator,
  type MatchLevel,
} from '@/features/applications'
import type { Requirement } from '@/features/jobs'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { links, paths } from '@/routes/paths'
import { RankingTable } from '../components/RankingTable'
import { WeightSlider } from '../components/WeightSlider'
import { useRanking, useSaveWeights } from '../hooks/use-ranking'
import { rankByWeights, type Ranked } from '../lib/score'
import { useJobDraft, useRankingDraft } from '../store'
import type { RankingData, RankingInput } from '../types'
import { useCrumb } from '@/hooks/use-crumb'

// US-05 · Design Spec 6.2
export default function JobRankingPage() {
  const { id = '' } = useParams()
  return <RankingWorkspace jobId={id} />
}

interface WorkspaceProps {
  jobId: string
  embedded?: boolean
  onOpenApplications?: () => void
}

export function RankingWorkspace({ jobId, embedded, onOpenApplications }: WorkspaceProps) {
  const { data, isPending, isError, error, refetch } = useRanking(jobId)

  if (isPending)
    return (
      <div aria-busy aria-label="Đang tải xếp hạng" className="space-y-6">
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  if (isError) return <ErrorState title="Chưa tải được xếp hạng" error={error} onRetry={refetch} />
  return <RankingView data={data} embedded={embedded} onOpenApplications={onOpenApplications} />
}

function RankingView({
  data,
  embedded,
  onOpenApplications,
}: { data: RankingData } & Omit<WorkspaceProps, 'jobId'>) {
  const jobId = data.job.id
  useCrumb(embedded ? undefined : `Xếp hạng · ${data.job.title}`)
  const draft = useJobDraft(jobId)
  const setWeight = useRankingDraft((s) => s.setWeight)
  const resetDraft = useRankingDraft((s) => s.reset)
  const { saveWeights, isPending: saving } = useSaveWeights(jobId)
  const queryClient = useQueryClient()
  const wide = useMediaQuery('(min-width: 64rem)')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [weightsOpen, setWeightsOpen] = useState(false)
  // F3: khay so sánh tối đa 3 người, giữ trong phiên xem xếp hạng
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const toggleCompare = useCallback(
    (id: string) =>
      setCompareIds((ids) =>
        ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 3 ? [...ids, id] : ids,
      ),
    [],
  )
  const compare = { ids: compareIds, onToggle: toggleCompare }

  const savedWeights = useMemo(
    () => Object.fromEntries(data.requirements.map((r) => [r.id, r.weight])),
    [data.requirements],
  )
  const weights = useMemo(() => ({ ...savedWeights, ...draft }), [savedWeights, draft])
  const deferredWeights = useDeferredValue(weights)

  const scored = useMemo(() => data.items.filter((i) => i.aiStatus === 'DONE'), [data.items])
  const inputs = useMemo(
    () =>
      scored.map((item) => ({
        id: item.applicationId,
        name: item.candidateName,
        matches: Object.fromEntries(item.matches.map((m) => [m.requirementId, m.match])),
        item,
      })),
    [scored],
  )

  const savedRank = useMemo(() => {
    const ranked = rankByWeights(inputs, savedWeights)
    return new Map(ranked.map((r) => [r.item.id, r.rank]))
  }, [inputs, savedWeights])
  const ranked = useMemo(() => rankByWeights(inputs, deferredWeights), [inputs, deferredWeights])

  const isDirty = data.requirements.some((r) => weights[r.id] !== r.weight)
  const changedCount = data.requirements.filter((r) => weights[r.id] !== r.weight).length
  const onWeightChange = useCallback(
    (requirementId: string, weight: number) => setWeight(jobId, requirementId, weight),
    [jobId, setWeight],
  )
  const onSelect = useCallback(
    (applicationId: string) => {
      setSelectedId(applicationId)
      void queryClient.prefetchQuery(applicationQueries.detail(applicationId))
    },
    [queryClient],
  )

  const save = () =>
    saveWeights(data.requirements.map(({ id, ...req }) => ({ ...req, weight: weights[id] })))

  const notScored = data.items.length - scored.length
  const selected = ranked.find((r) => r.item.id === selectedId) ?? null

  const weightBlock = (
    <WeightBlock
      requirements={data.requirements}
      weights={weights}
      isDirty={isDirty}
      saving={saving}
      onChange={onWeightChange}
      onReset={() => resetDraft(jobId)}
      onSave={save}
    />
  )

  const summary = (
    <Summary
      items={[
        `${scored.length.toLocaleString('vi-VN')} hồ sơ đã chấm`,
        notScored > 0 && `${notScored.toLocaleString('vi-VN')} đang đọc hoặc chưa đọc được`,
        isDirty && (
          <span key="draft" className="text-brand font-medium">
            đang thử trọng số (chưa lưu)
          </span>
        ),
      ]}
    />
  )

  return (
    <div className="space-y-6">
      {embedded ? (
        <p className="text-ink-muted num">{summary}</p>
      ) : (
        <PageHeader
          breadcrumb={
            <Link to={paths.jobs}>
              <ArrowLeft className="size-4" />
              Tin tuyển dụng
            </Link>
          }
          title={data.job.title}
          description={summary}
          actions={
            <Link
              to={links.applications({ jobId })}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Xem dạng bảng hồ sơ
            </Link>
          }
        />
      )}

      <div className="hidden md:block">{weightBlock}</div>
      <Button variant="secondary" className="w-full md:hidden" onClick={() => setWeightsOpen(true)}>
        <SlidersHorizontal />
        Trọng số ({data.requirements.length}){changedCount > 0 && ` · đã đổi ${changedCount}`}
      </Button>

      {ranked.length === 0 ? (
        <EmptyState
          title="Chưa có hồ sơ nào được chấm cho tin này"
          description="Hồ sơ sẽ hiện ở đây ngay khi hệ thống đọc xong CV. Bạn có thể tải CV hộ ứng viên từ bảng hồ sơ."
          action={
            onOpenApplications ? (
              <Button onClick={onOpenApplications}>Mở danh sách hồ sơ</Button>
            ) : (
              <Link to={links.applications({ jobId })} className={buttonVariants()}>
                Mở bảng hồ sơ
              </Link>
            )
          }
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <RankingTable
            rows={ranked}
            requirements={data.requirements}
            savedRank={savedRank}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          {wide && (
            <aside
              aria-label="Vì sao xếp hạng"
              className={cn('lg:sticky lg:self-start', embedded ? 'lg:top-0' : 'lg:top-[72px]')}
            >
              <WhyPanel
                jobId={jobId}
                selected={selected}
                requirements={data.requirements}
                topName={ranked[0]?.item.name}
                compare={compare}
              />
            </aside>
          )}
        </div>
      )}

      {!wide && (
        <SidePanel
          variant="sheet"
          open={!!selected}
          onClose={() => setSelectedId(null)}
          title={selected ? `Vì sao ${selected.item.name} #${selected.rank}` : ''}
        >
          <WhyPanel
            jobId={jobId}
            selected={selected}
            requirements={data.requirements}
            compare={compare}
            bare
          />
        </SidePanel>
      )}
      {compareIds.length > 0 && (
        <div
          role="region"
          aria-label="Khay so sánh"
          className="border-line bg-surface shadow-float sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-md border px-4 py-2.5"
        >
          <span className="type-label mr-1">So sánh {compareIds.length}/3</span>
          {compareIds.map((id) => {
            const name = ranked.find((r) => r.item.id === id)?.item.name ?? 'Ứng viên'
            return (
              <span
                key={id}
                className="bg-sunken text-ink inline-flex items-center gap-1 rounded-sm py-0.5 pr-1 pl-2 text-[13px]"
              >
                {name}
                <button
                  type="button"
                  aria-label={`Bỏ ${name} khỏi so sánh`}
                  className="hover:bg-line text-ink-muted inline-flex size-6 items-center justify-center rounded-sm"
                  onClick={() => toggleCompare(id)}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )
          })}
          <Button
            size="sm"
            className="ml-auto"
            disabled={compareIds.length < 2}
            title={compareIds.length < 2 ? 'Chọn thêm ít nhất một người' : undefined}
            onClick={() => setCompareOpen(true)}
          >
            So sánh
          </Button>
        </div>
      )}
      {compareOpen && (
        <CompareDialog open jobId={jobId} ids={compareIds} onClose={() => setCompareOpen(false)} />
      )}
      <SidePanel
        variant="sheet"
        open={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        title="Trọng số tiêu chí"
      >
        {weightBlock}
      </SidePanel>
    </div>
  )
}

function WeightBlock({
  requirements,
  weights,
  isDirty,
  saving,
  onChange,
  onReset,
  onSave,
}: {
  requirements: Requirement[]
  weights: Record<string, number>
  isDirty: boolean
  saving: boolean
  onChange: (id: string, w: number) => void
  onReset: () => void
  onSave: () => void
}) {
  return (
    <section
      aria-label="Trọng số tiêu chí"
      className={cn(
        'bg-surface rounded-md border px-5 py-4 transition-colors',
        isDirty ? 'border-brand/40' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-heading">
          Trọng số{' '}
          <span className="text-ink-muted text-[13px] font-normal">
            · 1 ít quan trọng, 3 rất quan trọng
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {isDirty && <span className="type-caption text-brand">Đang thử – chưa lưu</span>}
          <Button variant="quiet" size="sm" disabled={!isDirty} onClick={onReset}>
            Về mặc định
          </Button>
          {/* BR-AI-05 */}
          <Can
            permission={Permission.JobUpdate}
            fallback={<span className="type-caption">Chỉ là bản nháp để xem thử, không lưu.</span>}
          >
            <Button size="sm" disabled={!isDirty} loading={saving} onClick={onSave}>
              Lưu trọng số
            </Button>
          </Can>
        </div>
      </div>
      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        {requirements.map((req, i) => (
          <WeightSlider
            key={req.id}
            index={i}
            requirement={req}
            value={weights[req.id]}
            changed={weights[req.id] !== req.weight}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  )
}

function WhyPanel({
  jobId,
  selected,
  requirements,
  topName,
  compare,
  bare,
}: {
  jobId: string
  selected: Ranked<RankingInput> | null
  requirements: Requirement[]
  topName?: string
  compare: { ids: string[]; onToggle: (id: string) => void }
  bare?: boolean
}) {
  const detail = useQuery({
    ...applicationQueries.detail(selected?.item.id ?? ''),
    enabled: !!selected,
  })

  if (!selected)
    return (
      <div className="border-line rounded-md border border-dashed px-5 py-6">
        <p className="type-subheading">Bấm một dòng để xem vì sao</p>
        <p className="type-body mt-1">
          {topName ? `Ví dụ: vì sao ${topName} đứng đầu` : 'Mỗi tiêu chí'} – kèm câu trích làm căn
          cứ trong CV.
        </p>
      </div>
    )

  const evidence = new Map((detail.data?.breakdown ?? []).map((b) => [b.requirementId, b.evidence]))

  return (
    <div className={cn(!bare && 'border-line bg-surface rounded-md border px-5 py-4')}>
      {!bare && (
        <h2 className="type-heading">
          Vì sao {selected.item.name} #{selected.rank}
        </h2>
      )}
      <p className="mt-2 flex items-baseline gap-1">
        <span className="type-figure-sm">{selected.score}</span>
        <span className="type-caption">/100 theo trọng số đang thử</span>
      </p>
      <ul className="mt-3 space-y-3">
        {requirements.map((req, i) => {
          const level = (selected.item.matches[req.id] ?? 0) as MatchLevel
          const quote = evidence.get(req.id)
          return (
            <li key={req.id}>
              <p className="type-subheading">
                <span className="text-ink-muted num mr-1.5 font-normal">{i + 1}</span>
                {req.label}
              </p>
              <MatchIndicator level={level} />
              {detail.isPending
                ? level > 0 && <Skeleton className="mt-1 h-4 w-4/5" />
                : quote && (
                    <p className="type-body mt-0.5 text-[13px]">
                      “<span className="mark-evidence">{quote}</span>”
                    </p>
                  )}
            </li>
          )
        })}
      </ul>
      <Link
        to={links.applicationDetail(selected.item.id)}
        state={{ listQuery: `jobId=${jobId}&sortBy=score&order=DESC&limit=100` }}
        className={cn(buttonVariants(), 'mt-5 w-full')}
      >
        Mở bàn duyệt CV
        <ArrowRight />
      </Link>
      <Button
        variant="secondary"
        className="mt-2 w-full"
        disabled={!compare.ids.includes(selected.item.id) && compare.ids.length >= 3}
        title={
          !compare.ids.includes(selected.item.id) && compare.ids.length >= 3
            ? 'Đã đủ 3 người trong khay so sánh'
            : undefined
        }
        onClick={() => compare.onToggle(selected.item.id)}
      >
        {compare.ids.includes(selected.item.id) ? 'Bỏ khỏi so sánh' : 'Thêm vào so sánh'}
      </Button>
    </div>
  )
}
