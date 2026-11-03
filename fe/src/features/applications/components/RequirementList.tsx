import { ArrowDownRight } from 'lucide-react'
import type { Requirement } from '@/features/jobs'
import { REQUIREMENT_TYPE } from '@/features/jobs'
import { cn } from '@/lib/utils'
import type { MatchLevel } from '../constants'
import type { BreakdownItem } from '../types'
import { MatchIndicator } from './Score'

interface RequirementListProps {
  requirements: Requirement[]
  breakdown: BreakdownItem[]
  activeId: string | null
  locatable: ReadonlySet<string>
  onSelect: (id: string) => void
}

export function RequirementList({
  requirements,
  breakdown,
  activeId,
  locatable,
  onSelect,
}: RequirementListProps) {
  const byId = new Map(breakdown.map((b) => [b.requirementId, b]))

  return (
    <ol className="divide-line-soft border-line-soft divide-y border-t">
      {requirements.map((req, i) => {
        const item = byId.get(req.id)
        const level = (item?.match ?? 0) as MatchLevel
        const active = req.id === activeId
        const canLocate = !!item?.evidence && locatable.has(req.id)
        return (
          <li
            key={req.id}
            className={cn(
              'relative py-4 pr-2 pl-9 transition-colors duration-150',
              active && 'bg-brand-soft/40',
            )}
          >
            {active && <span aria-hidden className="bg-brand absolute inset-y-0 left-0 w-0.5" />}
            <span
              aria-hidden
              className={cn(
                'absolute top-[18px] left-2.5 flex size-[18px] items-center justify-center rounded-full border text-xs font-semibold',
                active ? 'border-brand bg-brand text-white' : 'border-ink-2 text-ink',
              )}
            >
              {i + 1}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h3 className="type-subheading">
                {req.label}
                {req.minYears != null && (
                  <span className="text-ink-muted font-normal"> · từ {req.minYears} năm</span>
                )}
              </h3>
              <span className="type-overline">
                {REQUIREMENT_TYPE[req.type].label} · trọng số {req.weight}
              </span>
            </div>

            <MatchIndicator level={level} rejected={!!item?.rejectedEvidence} className="mt-1" />

            {item?.evidence && (
              <blockquote className="type-body mt-2 italic">
                “<span className="mark-evidence not-italic">{item.evidence}</span>”
              </blockquote>
            )}

            {item?.rejectedEvidence && (
              <div className="bg-bad-soft mt-2 rounded-xs px-2.5 py-2">
                <p className="text-ink-2 decoration-bad/60 line-through">{item.rejectedEvidence}</p>
                <p className="text-bad mt-0.5 text-[13px]">
                  Câu trích không có trong CV nên đã bị loại khỏi điểm.
                </p>
              </div>
            )}

            {item?.evidence && (
              <button
                type="button"
                onClick={() => onSelect(req.id)}
                aria-pressed={active}
                disabled={!canLocate}
                className="text-brand disabled:text-ink-muted mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium hover:underline disabled:no-underline"
              >
                {canLocate ? (
                  <>
                    Xem trong CV
                    <ArrowDownRight className="size-3.5" />
                  </>
                ) : (
                  'Không định vị được đoạn này trong CV'
                )}
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
