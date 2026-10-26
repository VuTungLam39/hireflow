import { ArrowDown, ArrowUp } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui'
import {
  ApplicationStatusBadge,
  MATCH_LEVEL,
  ScoreFlags,
  ScoreValue,
} from '@/features/applications'
import type { Requirement } from '@/features/jobs'
import { countRender } from '@/lib/profiler'
import { cn } from '@/lib/utils'
import { links } from '@/routes/paths'
import type { RankingItem } from '../types'

interface RankingRowProps {
  item: RankingItem
  /** requirementId → mức khớp, dựng sẵn một lần (tham chiếu ổn định) */
  matches: Record<string, number>
  requirements: Requirement[]
  rank: number
  score: number
  /** Số bậc thay đổi so với trọng số đã lưu (dương = lên hạng) */
  delta: number
  index?: number
  measureRef?: (el: HTMLTableRowElement | null) => void
}

/** Ba hạng đầu có màu riêng, nhẹ nhàng */
const MEDAL = [
  'bg-amber-100 text-amber-800',
  'bg-slate-200 text-slate-700',
  'bg-orange-100 text-orange-800',
]

const MATCH_DOT: Record<number, string> = {
  1: 'bg-emerald-500',
  0.5: 'bg-amber-400',
  0: 'bg-slate-200 ring-1 ring-slate-300/60',
}

/**
 * Một dòng của bảng xếp hạng. Bọc memo và chỉ nhận props ổn định (object từ cache
 * + số nguyên), nên khi kéo trọng số chỉ các dòng đổi điểm/hạng render lại
 * (đo bằng React Profiler – FE Architecture mục 9.1).
 */
export const RankingRow = memo(function RankingRow({
  item,
  matches,
  requirements,
  rank,
  score,
  delta,
  index,
  measureRef,
}: RankingRowProps) {
  countRender('RankingRow')
  const medal = rank <= 3 ? MEDAL[rank - 1] : 'bg-slate-100 text-slate-500'
  return (
    <tr
      ref={measureRef}
      data-index={index}
      className={cn(
        'transition-colors duration-300',
        delta !== 0 ? 'bg-primary-soft/60' : 'hover:bg-slate-50/80',
      )}
    >
      <td className="py-2.5 pr-3 pl-4">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
              medal,
            )}
          >
            {rank}
          </span>
          {delta !== 0 && (
            <span
              key={delta}
              className={cn(
                'animate-scale-in inline-flex items-center text-xs font-medium tabular-nums',
                delta > 0 ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(delta)}
            </span>
          )}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={item.candidateName} size="sm" className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <Link
              to={links.applicationDetail(item.applicationId)}
              className="hover:text-primary font-medium transition-colors"
            >
              {item.candidateName}
            </Link>
            {item.flags.length > 0 && (
              <div className="mt-0.5">
                <ScoreFlags flags={item.flags} compact />
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-3">
        <ScoreValue score={score} />
      </td>
      {requirements.map((req) => {
        const match = matches[req.id] ?? 0
        return (
          <td key={req.id} className="hidden py-2.5 pr-3 text-center md:table-cell">
            <span
              title={`${req.label}: ${MATCH_LEVEL[match as keyof typeof MATCH_LEVEL].label}`}
              className={cn('inline-block size-2.5 rounded-full', MATCH_DOT[match])}
            />
          </td>
        )
      })}
      <td className="py-2.5 pr-4">
        <ApplicationStatusBadge status={item.status} />
      </td>
    </tr>
  )
})
