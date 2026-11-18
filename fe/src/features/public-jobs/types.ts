import type { PublicCompany } from '@/features/company'
import type {
  EmploymentType,
  JobLevel,
  PublicSalary,
  RequirementType,
  WorkMode,
} from '@/features/jobs'

/** KH MVP 3 mục 8.1: công ty đăng tin */
export interface PublicCompanyRef {
  name: string
  slug: string
  /** Đường dẫn sau apiUrl; null khi công ty chưa có logo */
  logoUrl: string | null
  tagline: string
}

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
  company: PublicCompanyRef
  /** US-24: tối đa 4 tin đang mở khác của cùng công ty */
  otherJobs: PublicJobSummary[]
}

export type PublicJobSummary = Omit<
  PublicJob,
  'jdText' | 'requirements' | 'expired' | 'benefits' | 'otherJobs'
>

/** US-23: thẻ công ty trong danh bạ /companies */
export interface PublicCompanyCard {
  slug: string
  name: string
  logoUrl: string | null
  tagline: string
  industries: string[]
  openJobs: number
}

/** US-23: trang /companies/:slug */
export interface PublicCompanyPage extends PublicCompany {
  slug: string
  jobs: PublicJobSummary[]
}

export interface PublicDepartmentCount {
  id: string
  name: string
  count: number
}
