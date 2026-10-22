import { CircleAlert, ShieldAlert } from 'lucide-react'
import { Badge, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  AI_STATUS,
  APPLICATION_STATUS,
  SCORE_FLAGS,
  type AiStatus,
  type ApplicationStatus,
  type ScoreFlag,
} from '../constants'

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, tone } = APPLICATION_STATUS[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

export function AiStatusBadge({ status }: { status: AiStatus }) {
  const { label, tone } = AI_STATUS[status]
  return (
    <Badge tone={tone}>
      {status === 'PROCESSING' && <Spinner className="size-3 border" />}
      {label}
    </Badge>
  )
}

const FLAG_ICON = { MISSING_MUST: CircleAlert, UNVERIFIED_EVIDENCE: ShieldAlert } as const

/**
 * Cờ điểm. `compact` (dùng trong bảng): chỉ hiện icon tròn có tooltip, để cột không bị
 * lấp đầy bởi cùng một nhãn lặp lại ở mọi dòng.
 */
export function ScoreFlags({ flags, compact }: { flags: ScoreFlag[]; compact?: boolean }) {
  if (!flags.length) return null
  if (compact) {
    return (
      <span className="inline-flex gap-1">
        {flags.map((flag) => {
          const Icon = FLAG_ICON[flag]
          const { label, tone } = SCORE_FLAGS[flag]
          return (
            <span
              key={flag}
              title={label}
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full ring-1 ring-inset',
                tone === 'danger'
                  ? 'bg-red-50 text-red-600 ring-red-600/15'
                  : 'bg-amber-50 text-amber-700 ring-amber-600/20',
              )}
            >
              <Icon className="size-3.5" />
              <span className="sr-only">{label}</span>
            </span>
          )
        })}
      </span>
    )
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((flag) => {
        const Icon = FLAG_ICON[flag]
        return (
          <Badge key={flag} tone={SCORE_FLAGS[flag].tone}>
            <Icon className="size-3" />
            {SCORE_FLAGS[flag].label}
          </Badge>
        )
      })}
    </span>
  )
}

/** Màu theo khoảng điểm: dùng chung cho thanh và vòng điểm */
const scoreTone = (score: number) =>
  score >= 70
    ? { bar: 'bg-emerald-500', text: 'text-emerald-600', stroke: 'stroke-emerald-500' }
    : score >= 40
      ? { bar: 'bg-amber-400', text: 'text-amber-600', stroke: 'stroke-amber-400' }
      : { bar: 'bg-red-400', text: 'text-red-500', stroke: 'stroke-red-400' }

/** Điểm 0–100 kèm thanh ngang; null = chưa có điểm. Thanh chạy mượt khi điểm đổi. */
export function ScoreValue({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400">—</span>
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-7 text-right font-semibold tabular-nums">{score}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-300 ease-out',
            scoreTone(score).bar,
          )}
          style={{ width: `${score}%` }}
        />
      </span>
    </span>
  )
}

/** Vòng điểm lớn cho trang chi tiết */
export function ScoreRing({ score }: { score: number }) {
  const r = 34
  const circumference = 2 * Math.PI * r
  const tone = scoreTone(score)
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-slate-100" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', tone.stroke)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-semibold tabular-nums', tone.text)}>{score}</span>
        <span className="text-[10px] tracking-wide text-slate-400 uppercase">/ 100</span>
      </div>
    </div>
  )
}
