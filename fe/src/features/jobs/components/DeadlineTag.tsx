import { cn, formatDate } from '@/lib/utils'
import { deadlineState } from '../lib/job-details'
import type { JobSummary } from '../types'

const TONE = {
  muted: 'text-ink-muted',
  warn: 'text-warn font-medium',
  bad: 'text-bad font-medium',
} as const

// BR-JOB-10: HR thấy ngay tin nào đã quá hạn nộp (đã ẩn khỏi trang tuyển dụng) để đóng
export function DeadlineTag({
  job,
  className,
}: {
  job: Pick<JobSummary, 'status' | 'deadline'>
  className?: string
}) {
  if (job.status === 'CLOSED' || !job.deadline) return null
  const state = deadlineState(job.deadline)
  if (!state) return null
  return (
    <span
      className={cn('text-[13px] leading-5', TONE[state.tone], className)}
      title={`Hạn nộp ${formatDate(job.deadline)}`}
    >
      {!state.expired
        ? state.text
        : job.status === 'OPEN'
          ? 'Hết hạn nộp · đã ẩn khỏi trang tuyển dụng'
          : 'Hạn nộp đã qua · đổi hạn trước khi đăng'}
    </span>
  )
}
