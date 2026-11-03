import { Check, CircleDashed, Minus, Quote, ShieldX } from 'lucide-react'
import { Badge } from '@/components/ui'
import { RequirementTypeBadge, type Requirement } from '@/features/jobs'
import { cn } from '@/lib/utils'
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
  1: { icon: Check, className: 'bg-good-soft text-good-ink' },
  0.5: { icon: CircleDashed, className: 'bg-warn-soft text-warn' },
  0: { icon: Minus, className: 'bg-sunken text-ink-faint' },
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
      {requirements.map((req) => {
        const item = byId.get(req.id)
        const level = item?.match ?? 0
        const match = MATCH_LEVEL[level]
        const { icon: Icon, className: iconClass } = MATCH_ICON[level]
        return (
          <li key={req.id} className="border-line-soft bg-canvas/50 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn('flex size-6 items-center justify-center rounded-full', iconClass)}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-ink font-medium">{req.label}</span>
              <RequirementTypeBadge type={req.type} />
              <span className="text-ink-faint text-xs">
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
                  'group border-good/70 bg-surface text-ink-2 mt-2.5 flex w-full items-start gap-2 rounded-sm border px-3 py-2 text-left text-sm transition-all duration-150',
                  'hover:border-good',
                  activeEvidence === item.evidence && 'border-good ring-good-soft ring-2',
                )}
              >
                <Quote className="text-good mt-0.5 size-3.5 shrink-0" />
                <span className="flex-1">{item.evidence}</span>
                <span className="text-good shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  Xem trong CV
                </span>
              </button>
            )}

            {item?.rejectedEvidence && (
              <div className="border-bad/70 bg-bad-soft/60 mt-2.5 flex items-start gap-2 rounded-sm border px-3 py-2 text-sm">
                <ShieldX className="text-bad mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p className="text-ink-muted decoration-bad line-through">
                    {item.rejectedEvidence}
                  </p>
                  <p className="text-bad mt-1 text-xs font-medium">
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
