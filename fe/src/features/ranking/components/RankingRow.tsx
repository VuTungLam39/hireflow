import { Flag } from 'lucide-react'
import { memo } from 'react'
import { Avatar } from '@/components/ui'
import { RequirementMarks, ScoreBadge, StatusPill } from '@/features/applications'
import type { Requirement } from '@/features/jobs'
import { countRender } from '@/lib/profiler'
import { cn } from '@/lib/utils'
import type { RankingItem } from '../types'

interface RankingRowProps {
  item: RankingItem
  matches: Record<string, number>
  requirements: Requirement[]
  rank: number
  score: number
  delta: number
  selected?: boolean
  onSelect?: (id: string) => void
  index?: number
  measureRef?: (el: HTMLTableRowElement | null) => void
}

export function RankDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="w-7" role="img" aria-label="Không đổi hạng" />
  return (
    <span
      className={cn('num w-7 text-xs font-semibold', delta > 0 ? 'text-good-ink' : 'text-bad')}
      aria-label={delta > 0 ? `Lên ${delta} hạng` : `Xuống ${-delta} hạng`}
    >
      {delta > 0 ? '▲' : '▼'}
      {Math.abs(delta)}
    </span>
  )
}

// FE Architecture 9.1
export const RankingRow = memo(function RankingRow({
  item,
  matches,
  requirements,
  rank,
  score,
  delta,
  selected,
  onSelect,
  index,
  measureRef,
}: RankingRowProps) {
  countRender('RankingRow')
  return (
    <tr
      ref={measureRef}
      data-index={index}
      data-key={item.applicationId}
      tabIndex={onSelect ? 0 : undefined}
      aria-selected={onSelect ? !!selected : undefined}
      onClick={() => onSelect?.(item.applicationId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(item.applicationId)
        }
      }}
      className={cn(
        'border-line-soft relative cursor-pointer border-b transition-colors duration-100 last:border-b-0 focus-visible:-outline-offset-2',
        selected ? 'bg-brand-soft/60' : 'hover:bg-canvas',
      )}
    >
      <td className="h-[52px] py-2 pr-2 pl-4">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              'num font-display w-7 text-right text-lg leading-6',
              rank <= 3 ? 'text-ink font-bold' : 'text-ink-2 font-semibold',
            )}
          >
            {rank}
          </span>
          <RankDelta delta={delta} />
        </span>
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={item.candidateName} size="sm" className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <p className="text-ink flex items-center gap-1.5 truncate font-medium">
              {item.candidateName}
              {item.flags.includes('MISSING_MUST') && (
                <span className="text-warn inline-flex" title="Thiếu tiêu chí bắt buộc">
                  <Flag aria-hidden className="size-3.5" />
                  <span className="sr-only">Thiếu tiêu chí bắt buộc</span>
                </span>
              )}
            </p>
            <StatusPill status={item.status} className="text-ink-muted text-xs font-normal" />
          </div>
        </div>
      </td>
      <td className="hidden py-2 pr-3 sm:table-cell">
        <RequirementMarks requirements={requirements} matches={matches} />
      </td>
      <td className="py-2 pr-4 text-right">
        <ScoreBadge score={score} />
      </td>
    </tr>
  )
})
