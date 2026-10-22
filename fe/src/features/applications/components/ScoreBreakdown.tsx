import { Check, CircleDashed, Minus, Quote, ShieldX } from 'lucide-react'
import { Badge } from '@/components/ui'
import { RequirementTypeBadge, type Requirement } from '@/features/jobs'
import { cn, staggerStyle } from '@/lib/utils'
import { MATCH_LEVEL, type MatchLevel } from '../constants'
import type { BreakdownItem } from '../types'

interface ScoreBreakdownProps {
  requirements: Requirement[]
  breakdown: BreakdownItem[]
  /** Đoạn trích đang được chọn (để tô sáng trong CV) */
  activeEvidence: string | null
  onEvidenceClick: (evidence: string) => void
}

const MATCH_ICON: Record<MatchLevel, { icon: typeof Check; className: string }> = {
  1: { icon: Check, className: 'bg-emerald-100 text-emerald-700' },
  0.5: { icon: CircleDashed, className: 'bg-amber-100 text-amber-700' },
  0: { icon: Minus, className: 'bg-slate-100 text-slate-400' },
}

/**
 * Điểm theo từng tiêu chí kèm bằng chứng (US-04). Bằng chứng bị loại vẫn hiện rõ
 * "đã bị hệ thống loại" – đây là một bước trong kịch bản demo.
 */
export function ScoreBreakdown({
  requirements,
  breakdown,
  activeEvidence,
  onEvidenceClick,
}: ScoreBreakdownProps) {
  const byId = new Map(breakdown.map((b) => [b.requirementId, b]))

  return (
    <ul className="space-y-2">
      {requirements.map((req, index) => {
        const item = byId.get(req.id)
        const level = item?.match ?? 0
        const match = MATCH_LEVEL[level]
        const { icon: Icon, className: iconClass } = MATCH_ICON[level]
        return (
          <li
            key={req.id}
            style={staggerStyle(index)}
            className="animate-slide-up stagger rounded-xl border border-slate-100 bg-slate-50/50 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn('flex size-6 items-center justify-center rounded-full', iconClass)}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="font-medium text-slate-800">{req.label}</span>
              <RequirementTypeBadge type={req.type} />
              <span className="text-xs text-slate-400">
                Trọng số {req.weight}
                {req.minYears != null && ` · tối thiểu ${req.minYears} năm`}
              </span>
              <Badge tone={match.tone} className="ml-auto">
                {match.label}
              </Badge>
            </div>

            {item?.evidence && (
              <button
                type="button"
                onClick={() => onEvidenceClick(item.evidence!)}
                title="Xem đoạn này trong CV"
                className={cn(
                  'group mt-2.5 flex w-full items-start gap-2 rounded-lg border border-emerald-200/70 bg-white px-3 py-2 text-left text-sm text-slate-700 transition-all duration-150',
                  'hover:border-emerald-300 hover:shadow-sm',
                  activeEvidence === item.evidence && 'border-emerald-400 ring-2 ring-emerald-100',
                )}
              >
                <Quote className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                <span className="flex-1">{item.evidence}</span>
                <span className="shrink-0 text-xs text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Xem trong CV
                </span>
              </button>
            )}

            {item?.rejectedEvidence && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-red-200/70 bg-red-50/60 px-3 py-2 text-sm">
                <ShieldX className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                <div>
                  <p className="text-slate-500 line-through decoration-red-300">
                    {item.rejectedEvidence}
                  </p>
                  <p className="mt-1 text-xs font-medium text-red-700">
                    Đã bị hệ thống loại: không tìm thấy đoạn này trong CV
                  </p>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
