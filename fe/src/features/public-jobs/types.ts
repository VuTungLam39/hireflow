import type {
  EmploymentType,
  JobLevel,
  PublicSalary,
  RequirementType,
  WorkMode,
} from '@/features/jobs'

/** Job hiển thị công khai: không có trọng số, từ khoá hay số liệu nội bộ */
export interface PublicJob {
  id: string
  title: string
  location: string
  department: { name: string }
  publishedAt: string
  /** BR-JOB-08: null = không hiện lương */
  salary: PublicSalary
  level: JobLevel | null
  employmentType: EmploymentType
  workMode: WorkMode
  headcount: number
  /** YYYY-MM-DD giờ Việt Nam */
  deadline: string | null
  /** BR-JOB-10: quá hạn thì vẫn xem được tin nhưng không có form nộp */
  expired: boolean
  benefits: string
  jdText: string
  requirements: { label: string; type: RequirementType }[]
}

export type PublicJobSummary = Omit<PublicJob, 'jdText' | 'requirements' | 'expired' | 'benefits'>

export interface PublicDepartmentCount {
  id: string
  name: string
  count: number
}
