import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { scoreTone } from '../lib/score-tone'
import {
  AI_STATUS,
  APPLICATION_STATUS,
  SCORE_FLAGS,
  type AiStatus,
  type ApplicationStatus,
  type ScoreFlag,
} from '../constants'

export function ProgressDot({ step, className }: { step: number; className?: string }) {
  const r = 5.25
  const angle = (step / 4) * 2 * Math.PI
  const x = 6 + r * Math.sin(angle)
  const y = 6 - r * Math.cos(angle)
  const large = step > 2 ? 1 : 0
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn('size-3 shrink-0', className)}>
      <circle cx="6" cy="6" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
      {step > 0 && step < 4 && (
        <path d={`M6 6 L6 0.75 A${r} ${r} 0 ${large} 1 ${x} ${y} Z`} fill="currentColor" />
      )}
      {step >= 4 && <circle cx="6" cy="6" r={r} fill="currentColor" />}
    </svg>
  )
}

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus
  className?: string
}) {
  const { label, step } = APPLICATION_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] leading-5 font-medium whitespace-nowrap',
        status === 'HIRED'
          ? 'text-good-ink'
          : status === 'WITHDRAWN'
            ? 'text-ink-muted'
            : 'text-ink-2',
        className,
      )}
    >
      {status === 'WITHDRAWN' ? (
        <span aria-hidden className="text-ink-faint w-3 text-center">
          —
        </span>
      ) : status === 'REJECTED' ? (
        <span aria-hidden className="bg-bad size-2.5 shrink-0 rounded-full" />
      ) : (
        <ProgressDot step={step} className={status === 'HIRED' ? 'text-good' : 'text-ink-2'} />
      )}
      {label}
    </span>
  )
}

export const ApplicationStatusBadge = StatusPill

export function AiStatusBadge({ status }: { status: AiStatus }) {
  if (status === 'DONE') return null
  const { label } = AI_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] leading-5 whitespace-nowrap',
        status === 'FAILED' ? 'text-bad' : 'text-ink-muted',
      )}
    >
      {status === 'PROCESSING' && <Spinner className="size-3 border-[1.5px]" label={label} />}
      {status === 'FAILED' && <span aria-hidden>⊘</span>}
      {label}
      {status === 'PROCESSING' && '…'}
    </span>
  )
}

export function ScoreFlags({ flags, compact }: { flags: ScoreFlag[]; compact?: boolean }) {
  if (!flags.length) return null
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
      {flags.map((flag) => {
        const { label } = SCORE_FLAGS[flag]
        const danger = flag === 'UNVERIFIED_EVIDENCE'
        return (
          <span
            key={flag}
            title={compact ? label : undefined}
            className={cn(
              'inline-flex items-center gap-1 text-[13px] leading-5 whitespace-nowrap',
              danger ? 'text-bad' : 'text-warn',
            )}
          >
            <span aria-hidden>{danger ? '⊘' : '⚑'}</span>
            <span className={compact ? 'sr-only' : undefined}>{label}</span>
          </span>
        )
      })}
    </span>
  )
}

export function ScoreBadge({
  score,
  stale,
  className,
}: {
  score: number | null
  stale?: boolean
  className?: string
}) {
  if (score === null)
    return (
      <span className={cn('text-ink-muted num', className)} aria-label="Chưa chấm">
        —
      </span>
    )
  const tone = scoreTone(score)
  return (
    <span
      className={cn('inline-flex items-center justify-end gap-2', className)}
      aria-label={`Mức phù hợp ${score} trên 100, ${tone.label}${stale ? ', điểm cũ' : ''}`}
    >
      <span aria-hidden className="bg-line relative h-1 w-6 overflow-hidden rounded-full">
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', tone.bar)}
          style={{ width: `${Math.max(8, score)}%` }}
        />
      </span>
      <span aria-hidden className={cn('num w-7 text-right text-sm font-semibold', tone.text)}>
        {score}
      </span>
      {stale && (
        <span aria-hidden className="text-ink-muted text-xs">
          cũ
        </span>
      )}
    </span>
  )
}

export const ScoreValue = ScoreBadge
