import type {
  EmploymentType,
  JobLevel,
  JobStatus,
  RequirementType,
  SalaryVisibility,
  WorkMode,
} from './constants'

export interface Requirement {
  id: string
  label: string
  type: RequirementType
  /** 1–3 */
  weight: number
  minYears: number | null
  keywords: string[]
}

export type RequirementInput = Omit<Requirement, 'id'>

/** Một dòng trong danh sách job */
export interface JobSummary {
  id: string
  title: string
  status: JobStatus
  location: string
  department: { id: string; name: string }
  applicationCount: number
  /** Phân bố hồ sơ theo nhóm trạng thái (một câu COUNT FILTER ở BE) */
  pipeline: JobPipeline
  publishedAt: string | null
  /** YYYY-MM-DD giờ Việt Nam (BR-JOB-10) */
  deadline: string | null
  createdAt: string
}

/** Thông tin hiển thị cho ứng viên (F-JOB-10, F-JOB-11) – không vào điểm, không đổi jdVersion */
export interface JobDetails {
  /** VND/tháng */
  salaryMin: number | null
  salaryMax: number | null
  salaryVisibility: SalaryVisibility
  level: JobLevel | null
  employmentType: EmploymentType
  workMode: WorkMode
  headcount: number
  deadline: string | null
  benefits: string
}

/** BR-JOB-08: ứng viên chỉ thấy số khi RANGE */
export type PublicSalary =
  { mode: 'RANGE'; min: number | null; max: number | null } | { mode: 'NEGOTIABLE' } | null

/**
 * new = NEW · inProgress = SCREENING + INTERVIEW + OFFER · hired = HIRED
 * closed = REJECTED + WITHDRAWN. Tổng bằng applicationCount.
 */
export interface JobPipeline {
  new: number
  inProgress: number
  hired: number
  closed: number
}

export interface Job extends JobSummary, JobDetails {
  jdText: string
  /** Tăng 1 mỗi lần lưu tiêu chí; điểm được tính lại theo phiên bản này */
  jdVersion: number
  requirements: Requirement[]
  updatedAt: string
}

export interface JobInput extends Partial<JobDetails> {
  title: string
  departmentId: string
  location: string
  jdText: string
}
