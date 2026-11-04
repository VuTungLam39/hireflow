import { Link } from 'react-router'
import { links } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { PIPELINE_STAGES } from '../constants'
import type { JobPipeline } from '../types'

interface PipelineCountsProps {
  pipeline: JobPipeline
  total: number
  jobId?: string
  className?: string
}

const STAGE_STATUS: Record<keyof JobPipeline, string | undefined> = {
  new: 'NEW',
  inProgress: undefined,
  hired: 'HIRED',
  closed: undefined,
}

export function PipelineCounts({ pipeline, total, jobId, className }: PipelineCountsProps) {
  if (total === 0) return <span className="type-caption">Chưa có hồ sơ</span>
  const summary = PIPELINE_STAGES.map((s) => `${s.label}: ${pipeline[s.key]}`).join(' · ')
  return (
    <span className={cn('num inline-flex gap-4 text-[13px]', className)} aria-label={summary}>
      {PIPELINE_STAGES.map((s) => {
        const value = pipeline[s.key]
        const status = STAGE_STATUS[s.key]
        const body = (
          <>
            <span className={cn('font-semibold', value ? 'text-ink' : 'text-ink-faint')}>
              {value.toLocaleString('vi-VN')}
            </span>{' '}
            <span className="text-ink-muted">{s.short}</span>
          </>
        )
        return jobId && status && value > 0 ? (
          <Link
            key={s.key}
            aria-hidden
            tabIndex={-1}
            to={links.applications({ jobId, status })}
            className="hover:[&>span:first-child]:text-brand whitespace-nowrap"
          >
            {body}
          </Link>
        ) : (
          <span key={s.key} aria-hidden className="whitespace-nowrap">
            {body}
          </span>
        )
      })}
    </span>
  )
}

export const PipelineBar = PipelineCounts
