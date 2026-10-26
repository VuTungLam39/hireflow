import { ArrowLeft } from 'lucide-react'
import { SlidersHorizontal, Trophy } from 'lucide-react'
import { useCallback, useDeferredValue, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Can, EmptyState, ErrorState, PageHeader } from '@/components/shared'
import { Button, Card, CardTitle, PageLoader } from '@/components/ui'
import { JobStatusBadge } from '@/features/jobs'
import { Permission } from '@/lib/permissions'
import { links, paths } from '@/routes/paths'
import { RankingTable } from '../components/RankingTable'
import { WeightSlider } from '../components/WeightSlider'
import { useRanking, useSaveWeights } from '../hooks/use-ranking'
import { rankByWeights } from '../lib/score'
import { useJobDraft, useRankingDraft } from '../store'
import type { RankingData } from '../types'

/** Bảng xếp hạng theo job + thanh trọng số (US-05) */
export default function JobRankingPage() {
  const { id = '' } = useParams()
  const { data, isPending, isError, error, refetch } = useRanking(id)

  if (isPending) return <PageLoader />
  if (isError) return <ErrorState error={error} onRetry={refetch} />
  return <RankingView data={data} />
}

function RankingView({ data }: { data: RankingData }) {
  const jobId = data.job.id
  const draft = useJobDraft(jobId)
  const setWeight = useRankingDraft((s) => s.setWeight)
  const resetDraft = useRankingDraft((s) => s.reset)
  const { saveWeights, isPending: saving } = useSaveWeights(jobId)

  const savedWeights = useMemo(
    () => Object.fromEntries(data.requirements.map((r) => [r.id, r.weight])),
    [data.requirements],
  )
  const weights = useMemo(() => ({ ...savedWeights, ...draft }), [savedWeights, draft])
  // Thanh kéo luôn mượt: phép xếp hạng chạy với giá trị "trễ" một nhịp
  const deferredWeights = useDeferredValue(weights)

  // Chỉ hồ sơ đã chấm xong mới có mức khớp để xếp hạng
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
  const onWeightChange = useCallback(
    (requirementId: string, weight: number) => setWeight(jobId, requirementId, weight),
    [jobId, setWeight],
  )

  const save = () =>
    saveWeights(data.requirements.map(({ id, ...req }) => ({ ...req, weight: weights[id] })))

  const notScored = data.items.length - scored.length

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <Link to={paths.jobs}>
            <ArrowLeft className="size-4" />
            Tin tuyển dụng
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            Xếp hạng: {data.job.title}
            <JobStatusBadge status={data.job.status} />
          </span>
        }
        description="Kéo trọng số để xem xếp hạng thay đổi ngay trên trình duyệt. Bấm Lưu để hệ thống tính lại điểm chính thức."
        actions={
          <Link
            to={links.applications({ jobId })}
            className="text-primary text-sm font-medium hover:underline"
          >
            Xem dạng bảng hồ sơ →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="space-y-5 self-start lg:sticky lg:top-8">
          <CardTitle icon={<SlidersHorizontal />}>Trọng số tiêu chí</CardTitle>
          <p className="-mt-2 text-xs text-slate-500">1 = ít quan trọng · 3 = rất quan trọng</p>
          {data.requirements.map((req) => (
            <WeightSlider
              key={req.id}
              requirement={req}
              value={weights[req.id]}
              changed={weights[req.id] !== req.weight}
              onChange={onWeightChange}
            />
          ))}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={!isDirty}
              onClick={() => resetDraft(jobId)}
            >
              Đặt lại
            </Button>
            {/* BR-AI-05: Hiring Manager chỉ kéo thử, không lưu */}
            <Can
              permission={Permission.JobUpdate}
              fallback={
                <p className="flex-1 self-center text-xs text-slate-500">
                  Chỉ là bản nháp để xem thử, không lưu.
                </p>
              }
            >
              <Button
                size="sm"
                className="flex-1"
                disabled={!isDirty}
                loading={saving}
                onClick={save}
              >
                Lưu trọng số
              </Button>
            </Can>
          </div>
        </Card>

        <Card className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <CardTitle icon={<Trophy />}>Xếp hạng</CardTitle>
            <span className="text-xs">
              {scored.length} hồ sơ đã chấm
              {notScored > 0 && ` · ${notScored} đang chấm hoặc lỗi (không có trong bảng)`}
            </span>
          </div>

          {ranked.length === 0 ? (
            <EmptyState
              title="Chưa có hồ sơ nào được chấm"
              description="Hồ sơ sẽ hiện ở đây sau khi hệ thống chấm điểm xong."
            />
          ) : (
            <RankingTable rows={ranked} requirements={data.requirements} savedRank={savedRank} />
          )}
        </Card>
      </div>
    </div>
  )
}
