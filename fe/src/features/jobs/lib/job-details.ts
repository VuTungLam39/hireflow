import { daysUntilIsoDay } from '@/lib/vn-day'
import type { JobDetails, PublicSalary } from '../types'

const MILLION = 1_000_000

/** 25_000_000 → "25"; 12_500_000 → "12,5" */
export const toMillions = (vnd: number) =>
  (vnd / MILLION).toLocaleString('vi-VN', { maximumFractionDigits: 1 })

// BR-JOB-08: cùng quy tắc với publicSalary của BE
export function salaryOf(job: Pick<JobDetails, 'salaryVisibility' | 'salaryMin' | 'salaryMax'>) {
  if (job.salaryVisibility === 'HIDDEN') return null
  if (job.salaryVisibility === 'RANGE' && (job.salaryMin || job.salaryMax)) {
    return { mode: 'RANGE', min: job.salaryMin, max: job.salaryMax } as const
  }
  return { mode: 'NEGOTIABLE' } as const
}

/** Design Spec 11.3: "15 – 25 triệu", "Từ 20 triệu", "Đến 30 triệu", "Thoả thuận"; null thì không hiện */
export function formatSalary(salary: PublicSalary): string | null {
  if (!salary) return null
  if (salary.mode === 'NEGOTIABLE') return 'Thoả thuận'
  const { min, max } = salary
  if (min && max)
    return min === max
      ? `${toMillions(min)} triệu`
      : `${toMillions(min)} – ${toMillions(max)} triệu`
  if (min) return `Từ ${toMillions(min)} triệu`
  if (max) return `Đến ${toMillions(max)} triệu`
  return 'Thoả thuận'
}

export type DeadlineState = { text: string; tone: 'muted' | 'warn' | 'bad'; expired: boolean }

/** Design Spec 11.3: "Còn 5 ngày", "Hạn chót hôm nay", "Đã hết hạn nhận hồ sơ" */
export function deadlineState(
  deadline: string | null,
  now: Date = new Date(),
): DeadlineState | null {
  if (!deadline) return null
  const days = daysUntilIsoDay(deadline, now)
  if (days < 0) return { text: 'Đã hết hạn nhận hồ sơ', tone: 'bad', expired: true }
  if (days === 0) return { text: 'Hạn chót hôm nay', tone: 'warn', expired: false }
  return {
    text: `Còn ${days.toLocaleString('vi-VN')} ngày`,
    tone: days <= 3 ? 'warn' : 'muted',
    expired: false,
  }
}
