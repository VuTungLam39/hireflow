import type { Requirement } from '@/features/jobs'
import { cn } from '@/lib/utils'
import { MATCH_LEVEL, type MatchLevel } from '../constants'
import { scoreTone } from '../lib/score-tone'
import { ProgressDot } from './StatusBadges'

const LEVEL_STYLE = {
  1: { step: 4, color: 'text-good', text: 'text-good-ink', glyph: '●' },
  0.5: { step: 2, color: 'text-warn', text: 'text-warn', glyph: '◐' },
  0: { step: 0, color: 'text-ink-faint', text: 'text-ink-muted', glyph: '○' },
} as const

export function MatchGlyph({
  level,
  rejected,
  className,
}: {
  level: MatchLevel
  rejected?: boolean
  className?: string
}) {
  if (rejected && level === 0)
    return (
      <span aria-hidden className={cn('text-bad w-3 text-center text-xs leading-none', className)}>
        ⊘
      </span>
    )
  const s = LEVEL_STYLE[level]
  return <ProgressDot step={s.step} className={cn(s.color, className)} />
}

export function MatchIndicator({
  level,
  rejected,
  detail,
  className,
}: {
  level: MatchLevel
  rejected?: boolean
  detail?: string
  className?: string
}) {
  const isRejected = rejected && level === 0
  const label = isRejected ? 'Câu trích không có trong CV – đã loại' : MATCH_LEVEL[level].label
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] leading-5 font-medium',
        isRejected ? 'text-bad' : LEVEL_STYLE[level].text,
        className,
      )}
    >
      <MatchGlyph level={level} rejected={rejected} />
      {label}
      {detail && <span className="text-ink-muted font-normal">· {detail}</span>}
    </span>
  )
}

export function RequirementMarks({
  requirements,
  matches,
  className,
}: {
  requirements: Pick<Requirement, 'id' | 'label'>[]
  matches: Record<string, number | undefined>
  className?: string
}) {
  const summary = requirements
    .map((r) => `${r.label}: ${MATCH_LEVEL[(matches[r.id] ?? 0) as MatchLevel].label}`)
    .join('; ')
  return (
    <span
      role="img"
      aria-label={summary}
      title={summary}
      className={cn('inline-flex gap-1', className)}
    >
      {requirements.map((r) => (
        <MatchGlyph key={r.id} level={(matches[r.id] ?? 0) as MatchLevel} />
      ))}
    </span>
  )
}

export function ScoreMeter({
  score,
  requirements,
  matches,
  className,
  compact,
}: {
  score: number
  requirements: Requirement[]
  matches: Record<string, number | undefined>
  className?: string
  compact?: boolean
}) {
  const tone = scoreTone(score)
  const total = requirements.reduce((s, r) => s + r.weight, 0) || 1
  return (
    <div className={className}>
      <p className="flex items-baseline gap-1">
        <span className={cn('type-figure', compact && 'text-2xl leading-8')}>{score}</span>
        <span className="type-caption">/100</span>
        <span className={cn('ml-2 text-[13px] font-medium', tone.text)}>{tone.label}</span>
      </p>
      <div
        className="mt-2 flex h-2 gap-0.5"
        role="img"
        aria-label={`Điểm gồm ${requirements.length} tiêu chí, độ rộng mỗi đoạn theo trọng số`}
      >
        {requirements.map((r) => {
          const m = matches[r.id] ?? 0
          return (
            <span
              key={r.id}
              title={`${r.label} · trọng số ${r.weight} · ${MATCH_LEVEL[m as MatchLevel].label}`}
              style={{ flexGrow: r.weight / total }}
              className={cn(
                'h-full min-w-1 basis-0 first:rounded-l-full last:rounded-r-full',
                m === 1 ? 'bg-good' : m === 0.5 ? 'bg-warn/70' : 'bg-sunken',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
