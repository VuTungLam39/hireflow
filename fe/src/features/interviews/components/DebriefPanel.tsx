import { Star } from 'lucide-react'
import { useDebrief } from '../hooks/use-interviews'
import { RECOMMENDATION, RECOMMENDATION_ORDER } from '../lib/constants'
import type { DebriefRecommendations } from '../types'

function Tally({ counts }: { counts: DebriefRecommendations }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Đề xuất tuyển">
      {RECOMMENDATION_ORDER.filter((r) => counts[r] > 0).map((r) => (
        <li key={r} className="bg-sunken text-ink-2 rounded-full px-2 py-0.5 text-[13px]">
          {RECOMMENDATION[r].label} <span className="text-ink num font-semibold">{counts[r]}</span>
        </li>
      ))}
      {counts.NONE > 0 && (
        <li className="bg-sunken text-ink-muted rounded-full px-2 py-0.5 text-[13px]">
          Không nêu đề xuất <span className="num font-semibold">{counts.NONE}</span>
        </li>
      )}
    </ul>
  )
}

// MVP 3.1 · F-INT-05, BR-INT-07: chỉ tổng hợp để quyết định, không tự đổi trạng thái
export function DebriefPanel({ applicationId }: { applicationId: string }) {
  const { data } = useDebrief(applicationId)
  if (!data || data.feedbackCount === 0) return null
  return (
    <section
      aria-labelledby="debrief-title"
      className="border-line space-y-4 rounded-md border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="debrief-title" className="type-heading">
          Tổng hợp phỏng vấn
        </h3>
        <span className="text-ink-2 flex items-center gap-1 text-sm">
          {data.feedbackCount} phiếu · chung
          <Star aria-hidden className="text-warn size-4 fill-current" />
          <span className="text-ink num font-semibold">{data.overallAvg}/5</span>
        </span>
      </div>
      <Tally counts={data.recommendations} />
      <ol className="space-y-3">
        {data.groups.map((g) => (
          <li
            key={g.stage?.id ?? `round-${g.round}`}
            className="bg-canvas space-y-2 rounded-sm p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-ink font-medium">
                Vòng {g.round}
                {g.stage && <span className="text-ink-2 font-normal"> · {g.stage.name}</span>}
              </span>
              <span className="text-ink-2">
                {g.feedbackCount}/{g.expectedFeedbacks} phiếu
                {g.overallAvg !== null && ` · chung ${g.overallAvg}/5`}
              </span>
            </div>
            {g.criteria.length > 0 && (
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {g.criteria.map((c) => (
                  <div key={c.requirementId} className="flex justify-between gap-2">
                    <dt className="text-ink-2 truncate">{c.label}</dt>
                    <dd className="text-ink num font-medium">{c.avg}</dd>
                  </div>
                ))}
              </dl>
            )}
            <Tally counts={g.recommendations} />
          </li>
        ))}
      </ol>
    </section>
  )
}
