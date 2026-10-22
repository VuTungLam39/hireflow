import type { BadgeTone } from '@/components/ui'

/** Nguồn sự thật cho trạng thái application (kickoff mục 5.2). Giá trị khớp BE. */
export const APPLICATION_STATUS = {
  NEW: { label: 'Mới', tone: 'neutral', terminal: false },
  SCREENING: { label: 'Sàng lọc CV', tone: 'info', terminal: false },
  INTERVIEW: { label: 'Phỏng vấn', tone: 'warning', terminal: false },
  OFFER: { label: 'Đề nghị', tone: 'info', terminal: false },
  HIRED: { label: 'Đã nhận', tone: 'success', terminal: true },
  REJECTED: { label: 'Từ chối', tone: 'danger', terminal: true },
  WITHDRAWN: { label: 'Ứng viên rút', tone: 'neutral', terminal: true },
} as const satisfies Record<string, { label: string; tone: BadgeTone; terminal: boolean }>
export type ApplicationStatus = keyof typeof APPLICATION_STATUS
export const APPLICATION_STATUSES = Object.keys(APPLICATION_STATUS) as [
  ApplicationStatus,
  ...ApplicationStatus[],
]

/**
 * Luồng hợp lệ – chỉ để FE hiện đúng nút; BE vẫn kiểm (INVALID_STATUS_TRANSITION).
 * OFFER → HIRED đi route riêng PATCH /applications/:id/hire (quyền application:approve-offer).
 */
export const NEXT_STATUS: Record<ApplicationStatus, ApplicationStatus[]> = {
  NEW: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['HIRED', 'REJECTED', 'WITHDRAWN'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
}
export const REASON_REQUIRED: ApplicationStatus[] = ['REJECTED']

export const AI_STATUS = {
  PENDING: { label: 'Chờ xử lý', tone: 'neutral' },
  PROCESSING: { label: 'Đang chấm', tone: 'info' },
  DONE: { label: 'Đã chấm', tone: 'success' },
  FAILED: { label: 'Lỗi', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type AiStatus = keyof typeof AI_STATUS

export const SCORE_FLAGS = {
  MISSING_MUST: { label: 'Thiếu tiêu chí bắt buộc', tone: 'warning' },
  UNVERIFIED_EVIDENCE: { label: 'Có bằng chứng bị loại', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type ScoreFlag = keyof typeof SCORE_FLAGS

/** Mức khớp của một tiêu chí (kickoff mục 8.4) */
export const MATCH_LEVEL = {
  1: { label: 'Khớp', tone: 'success' },
  0.5: { label: 'Một phần', tone: 'warning' },
  0: { label: 'Không khớp', tone: 'neutral' },
} as const satisfies Record<number, { label: string; tone: BadgeTone }>
export type MatchLevel = keyof typeof MATCH_LEVEL

/** Nguồn hồ sơ (API Contract 2.1). MVP 2 thêm MATCH_INVITE. */
export const APPLICATION_SOURCE = {
  PUBLIC_FORM: { label: 'Trang tuyển dụng', tone: 'neutral' },
  HR_UPLOAD: { label: 'HR tải hộ', tone: 'info' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type ApplicationSource = keyof typeof APPLICATION_SOURCE

/** Cột được sort – khớp whitelist của BE */
export const APPLICATION_SORT_FIELDS = ['createdAt', 'score'] as const

/** Hỏi lại trạng thái AI mỗi 3 giây khi đang chấm (FE Architecture mục 9.3) */
export const AI_POLL_INTERVAL = 3_000
