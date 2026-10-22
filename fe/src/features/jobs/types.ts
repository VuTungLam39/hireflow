import type { JobStatus, RequirementType } from './constants'

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
  createdAt: string
}

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

export interface Job extends JobSummary {
  jdText: string
  /** Tăng 1 mỗi lần lưu tiêu chí; điểm được tính lại theo phiên bản này */
  jdVersion: number
  requirements: Requirement[]
  updatedAt: string
}

export interface JobInput {
  title: string
  departmentId: string
  location: string
  jdText: string
}
