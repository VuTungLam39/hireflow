import type { ApplicationSource, ApplicationStatus } from '@/features/applications'

/** Một dòng trong kho ứng viên (API Contract 4.11) */
export interface CandidateListItem {
  id: string
  fullName: string
  email: string
  phone: string | null
  /** Số hồ sơ người xem được thấy (Hiring Manager: chỉ phòng mình) */
  applicationCount: number
  lastAppliedAt: string | null
  /** Khác null = đã ẩn danh (BR-DATA-03) */
  anonymizedAt: string | null
  createdAt: string
}

export interface CandidateApplication {
  id: string
  job: { id: string; title: string }
  status: ApplicationStatus
  source: ApplicationSource
  score: number | null
  createdAt: string
}

export interface CandidateDetail extends CandidateListItem {
  applications: CandidateApplication[]
}

/** PATCH /candidates/:id – không sửa email (BR-CAND-01) */
export interface CandidateUpdateInput {
  fullName?: string
  phone?: string | null
}

export interface CandidateListParams {
  search?: string
  cursor?: string
  limit?: number
}
