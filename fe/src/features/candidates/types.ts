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
  lastJob: { title: string; status: ApplicationStatus } | null
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

/** F-SEARCH-01 · US-13: kết quả tìm theo kỹ năng trong CV, mỗi ứng viên một dòng */
export type CvSection = 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'other'

export interface CvSearchItem {
  candidateId: string
  candidateName: string
  applicationId: string
  section: CvSection
  excerpt: { text: string; highlights: [number, number][] }
  /** keyword: CV có đúng từ đã gõ; meaning: chỉ gần nghĩa theo AI */
  match: 'keyword' | 'meaning'
}

export interface CvSearchResult {
  items: CvSearchItem[]
  /** true: dịch vụ embedding lỗi, chỉ tìm theo từ khoá */
  degraded: boolean
}
