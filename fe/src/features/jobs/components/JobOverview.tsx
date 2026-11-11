import type { ReactNode } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { PIPELINE_STAGES } from '../constants'
import { salaryOf } from '../lib/job-details'
import { JobFacts } from './JobFacts'
import type { Job } from '../types'

const STAGE_STATUS: Partial<Record<keyof Job['pipeline'], string>> = { new: 'NEW', hired: 'HIRED' }

interface JobOverviewProps {
  job: Job
  onOpenApplications: (status?: string) => void
  highlights?: ReactNode
  /** F1: phễu của tin, do tầng layout ghép vào để jobs không phụ thuộc dashboard */
  funnel?: ReactNode
}

// F-JOB-01
export function JobOverview({ job, onOpenApplications, highlights, funnel }: JobOverviewProps) {
  const facts: [string, string][] = [
    ['Ngày tạo', formatDate(job.createdAt)],
    ['Cập nhật lần cuối', formatDate(job.updatedAt)],
    ['Phiên bản tiêu chí', `${job.jdVersion}`],
  ]

  return (
    <div className="space-y-8">
      <section aria-labelledby="job-apps">
        <div className="flex items-baseline justify-between gap-4">
          <h3 id="job-apps" className="type-heading">
            Hồ sơ theo bước
          </h3>
          {job.status !== 'DRAFT' && job.applicationCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenApplications()}
              className="text-brand text-sm font-medium hover:underline"
            >
              Xem {job.applicationCount.toLocaleString('vi-VN')} hồ sơ →
            </button>
          )}
        </div>
        {job.status === 'DRAFT' ? (
          <p className="type-body mt-2">Tin nháp chưa nhận hồ sơ. Đăng tin để bắt đầu nhận CV.</p>
        ) : (
          <dl className="border-line mt-3 grid grid-cols-2 rounded-md border sm:grid-cols-4">
            {PIPELINE_STAGES.map((s, i) => {
              const value = job.pipeline[s.key]
              const status = STAGE_STATUS[s.key]
              const figure = (
                <span
                  className={cn(
                    'num font-display text-2xl leading-8 font-semibold',
                    value === 0 && 'text-ink-faint',
                    value > 0 && s.key === 'new' && 'bg-marker text-ink rounded-xs px-1.5',
                    value > 0 && s.key === 'hired' && 'text-good-ink',
                  )}
                >
                  {value.toLocaleString('vi-VN')}
                </span>
              )
              return (
                <div
                  key={s.key}
                  className={cn(
                    'border-line-soft px-4 py-3',
                    i > 0 && 'sm:border-l',
                    i % 2 === 1 && 'border-l',
                    i > 1 && 'border-t sm:border-t-0',
                  )}
                >
                  <dt className="type-caption">{s.label}</dt>
                  <dd className="mt-1">
                    {status && value > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenApplications(status)}
                        title={`Xem ${value} hồ sơ ${s.label.toLowerCase()}`}
                        className="hover:ring-ink/20 rounded-xs hover:ring-1"
                      >
                        {figure}
                      </button>
                    ) : (
                      figure
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </section>

      {job.status !== 'DRAFT' && job.applicationCount > 0 && highlights}
      {job.status !== 'DRAFT' && job.applicationCount > 0 && funnel}

      <section aria-labelledby="job-candidate-facts" className="space-y-3">
        <h3 id="job-candidate-facts" className="type-heading">
          Ứng viên sẽ thấy
        </h3>
        <JobFacts job={{ ...job, salary: salaryOf(job) }} />
      </section>

      <dl
        aria-label="Thông tin chung"
        className="border-line grid gap-4 border-t pt-5 sm:grid-cols-3"
      >
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="type-caption">{label}</dt>
            <dd className="text-ink num mt-0.5 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
