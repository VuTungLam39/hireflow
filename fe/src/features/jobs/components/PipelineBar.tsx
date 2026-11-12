import { Fragment } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { links } from '@/routes/paths'
import { PIPELINE_STAGES } from '../constants'
import type { JobPipeline } from '../types'

type Stage = keyof JobPipeline

const STAGE: Record<Stage, { status?: string; tone: string }> = {
  new: { status: 'NEW', tone: 'bg-marker text-ink rounded-xs px-1 font-medium' },
  inProgress: { tone: '' },
  hired: { status: 'HIRED', tone: 'text-good-ink font-medium' },
  closed: { tone: '' },
}

interface PipelineCountsProps {
  pipeline: JobPipeline
  total: number
  jobId?: string
  className?: string
}

// Design Spec 6.5 · App Screens 7.4
export function PipelineCounts({ pipeline, total, jobId, className }: PipelineCountsProps) {
  if (total === 0) {
    return <span className={cn('num text-ink-muted block text-right', className)}>0</span>
  }
  const parts = PIPELINE_STAGES.filter((s) => pipeline[s.key] > 0)
  const totalText = total.toLocaleString('vi-VN')

  return (
    <div className={cn('num text-right', className)}>
      <span className="sr-only">
        {`${totalText} hồ sơ: ${parts.map((s) => `${pipeline[s.key]} ${s.short}`).join(', ')}`}
      </span>
      <div aria-hidden>
        {jobId ? (
          <Link
            tabIndex={-1}
            to={links.applications({ jobId })}
            title={`Xem ${totalText} hồ sơ của tin`}
            className="text-ink hover:text-brand font-semibold transition-colors"
          >
            {totalText}
          </Link>
        ) : (
          <span className="text-ink font-semibold">{totalText}</span>
        )}
      </div>
      <p aria-hidden className="type-caption mt-0.5">
        {parts.map((s, i) => {
          const value = pipeline[s.key]
          const { status, tone } = STAGE[s.key]
          const label = (
            <span className={tone}>
              {value.toLocaleString('vi-VN')} {s.short}
            </span>
          )
          return (
            <Fragment key={s.key}>
              {i > 0 && ' '}
              <span className="whitespace-nowrap">
                {i > 0 && (
                  <span aria-hidden className="text-ink-faint mr-1">
                    ·
                  </span>
                )}
                {jobId && status ? (
                  <Link
                    tabIndex={-1}
                    to={links.applications({ jobId, status })}
                    title={`Xem ${value} hồ sơ ${s.label.toLowerCase()}`}
                    className="hover:text-ink hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </span>
            </Fragment>
          )
        })}
      </p>
    </div>
  )
}
