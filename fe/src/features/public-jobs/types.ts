import type { RequirementType } from '@/features/jobs'

/** Job hiển thị công khai: không có trọng số, từ khoá hay số liệu nội bộ */
export interface PublicJob {
  id: string
  title: string
  location: string
  department: { name: string }
  publishedAt: string
  jdText: string
  requirements: { label: string; type: RequirementType }[]
}

export type PublicJobSummary = Omit<PublicJob, 'jdText' | 'requirements'>
