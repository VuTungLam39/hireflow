import { cn } from '@/lib/utils'
import { JOB_STATUS, REQUIREMENT_TYPE, type JobStatus, type RequirementType } from '../constants'

const DOT: Record<JobStatus, string> = {
  DRAFT: 'border border-ink-faint',
  OPEN: 'bg-good',
  CLOSED: 'bg-ink-faint',
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap',
        status === 'OPEN' ? 'text-good-ink' : 'text-ink-muted',
      )}
    >
      <span aria-hidden className={cn('size-2 rounded-full', DOT[status])} />
      {JOB_STATUS[status].label}
    </span>
  )
}

export function RequirementTypeBadge({ type }: { type: RequirementType }) {
  return (
    <span className={cn('type-overline', type === 'MUST' && 'text-warn')}>
      {REQUIREMENT_TYPE[type].label}
    </span>
  )
}
