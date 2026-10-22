import type { Requirement } from '@/features/jobs'
import type { AiStatus, ApplicationStatus, MatchLevel, ScoreFlag } from './constants'

export interface ApplicationListItem {
  id: string
  status: ApplicationStatus
  aiStatus: AiStatus
  /** null khi chưa chấm xong */
  score: number | null
  flags: ScoreFlag[]
  createdAt: string
  candidate: { id: string; fullName: string; email: string }
  job: { id: string; title: string }
}

/** Kết quả đối chiếu một tiêu chí với CV */
export interface BreakdownItem {
  requirementId: string
  match: MatchLevel
  /** Đoạn trích nguyên văn trong CV, đã được code kiểm là có thật */
  evidence: string | null
  /** Đoạn AI trích nhưng không tìm thấy trong CV → bị hệ thống loại (UNVERIFIED_EVIDENCE) */
  rejectedEvidence: string | null
}

export interface ApplicationDetail extends ApplicationListItem {
  candidate: { id: string; fullName: string; email: string; phone: string | null }
  job: { id: string; title: string; jdVersion: number; departmentId: string }
  requirements: Requirement[]
  breakdown: BreakdownItem[]
  /** Điểm được tính theo phiên bản tiêu chí nào */
  scoredJdVersion: number | null
  aiError: string | null
  /** null khi CV đã bị xoá do ẩn danh (BR-DATA-03) */
  cv: { fileId: string; fileName: string; text: string | null } | null
}

export interface StatusHistoryItem {
  id: string
  fromStatus: ApplicationStatus | null
  toStatus: ApplicationStatus
  reason: string | null
  changedBy: { id: string; fullName: string } | null
  changedAt: string
}

/** POST /jobs/:id/applications – HR tải CV hộ (API Contract 4.5) */
export interface HrUploadInput {
  fullName: string
  email: string
  /** Tuỳ chọn khi HR tải hộ */
  phone?: string
  /** HR xác nhận ứng viên đã đồng ý xử lý dữ liệu; BE lưu consent_version = HR_CONFIRMED */
  consentConfirmed: boolean
  cv: File
}

/** Ghi chú không sửa, không xoá (BR-APP-09) */
export interface ApplicationNote {
  id: string
  content: string
  author: { id: string; fullName: string }
  createdAt: string
}
