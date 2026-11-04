import { CalendarClock, Clock3, MapPin, Users, Wallet, BriefcaseBusiness } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { EMPLOYMENT_TYPE, JOB_LEVEL, WORK_MODE } from '../constants'
import { deadlineState, formatSalary } from '../lib/job-details'
import type { JobDetails, PublicSalary } from '../types'

export interface JobFactsData extends Pick<
  JobDetails,
  'level' | 'employmentType' | 'workMode' | 'headcount' | 'deadline'
> {
  salary: PublicSalary
}

const toneClass = { muted: 'text-ink', warn: 'text-warn', bad: 'text-bad' } as const

type Fact = { key: string; icon: ReactNode; label: string; value: ReactNode }

// F-PUB-05 · Design Spec 11.1: lưới thông tin nhanh của tin
export function JobFacts({
  job,
  className,
  relativeDeadline = true,
}: {
  job: JobFactsData
  className?: string
  /** false: hiện ngày cố định (HTML dựng sẵn không phụ thuộc thời điểm xem) */
  relativeDeadline?: boolean
}) {
  const salary = job.salary === undefined ? null : formatSalary(job.salary)
  const deadline = relativeDeadline
    ? deadlineState(job.deadline)
    : job.deadline
      ? { text: formatDate(job.deadline), tone: 'muted' as const, expired: false }
      : null
  const all: (Fact | null)[] = [
    salary ? { key: 'salary', icon: <Wallet />, label: 'Mức lương', value: salary } : null,
    job.level
      ? {
          key: 'level',
          icon: <BriefcaseBusiness />,
          label: 'Cấp bậc',
          value: JOB_LEVEL[job.level],
        }
      : null,
    // Thiếu trường (API cũ khi FE deploy trước BE) thì bỏ ô đó, không làm vỡ prerender
    job.employmentType
      ? {
          key: 'type',
          icon: <Clock3 />,
          label: 'Hình thức',
          value: EMPLOYMENT_TYPE[job.employmentType],
        }
      : null,
    job.workMode
      ? { key: 'mode', icon: <MapPin />, label: 'Làm việc', value: WORK_MODE[job.workMode] }
      : null,
    job.headcount
      ? {
          key: 'headcount',
          icon: <Users />,
          label: 'Số lượng',
          value: `${job.headcount.toLocaleString('vi-VN')} người`,
        }
      : null,
    deadline
      ? {
          key: 'deadline',
          icon: <CalendarClock />,
          label: 'Hạn nộp',
          value: <span className={toneClass[deadline.tone]}>{deadline.text}</span>,
        }
      : null,
  ]
  const facts = all.filter((f): f is Fact => f !== null)

  return (
    <dl
      className={cn(
        'border-line divide-line-soft grid grid-cols-2 gap-px overflow-hidden rounded-md border sm:grid-cols-3',
        className,
      )}
    >
      {facts.map((f) => (
        <div key={f.key} className="bg-surface flex items-start gap-2.5 px-4 py-3">
          <span aria-hidden className="text-ink-muted mt-0.5 [&_svg]:size-4">
            {f.icon}
          </span>
          <div className="min-w-0">
            <dt className="type-caption">{f.label}</dt>
            <dd className="text-ink text-sm font-medium">{f.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
