import type { BadgeTone } from '@/components/ui'

/** Nguồn sự thật cho trạng thái application (kickoff mục 5.2). Giá trị khớp BE. */
export const APPLICATION_STATUS = {
  NEW: { label: 'Mới', tone: 'neutral', terminal: false, step: 0 },
  SCREENING: { label: 'Sàng lọc', tone: 'info', terminal: false, step: 1 },
  INTERVIEW: { label: 'Phỏng vấn', tone: 'warning', terminal: false, step: 2 },
  OFFER: { label: 'Đề nghị', tone: 'info', terminal: false, step: 3 },
  HIRED: { label: 'Đã nhận', tone: 'success', terminal: true, step: 4 },
  REJECTED: { label: 'Từ chối', tone: 'danger', terminal: true, step: -1 },
  WITHDRAWN: { label: 'Ứng viên rút', tone: 'neutral', terminal: true, step: -1 },
} as const satisfies Record<
  string,
  { label: string; tone: BadgeTone; terminal: boolean; step: number }
>
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

// BR-APP-05, F-APP-10
export const REOPENABLE: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN']

export const AI_STATUS = {
  PENDING: { label: 'Chờ đọc CV', tone: 'neutral' },
  PROCESSING: { label: 'Đang đọc CV', tone: 'info' },
  DONE: { label: 'Đã chấm', tone: 'success' },
  FAILED: { label: 'Không đọc được CV', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type AiStatus = keyof typeof AI_STATUS

export const SCORE_FLAGS = {
  MISSING_MUST: { label: 'Thiếu tiêu chí bắt buộc', short: 'thiếu bắt buộc', tone: 'warning' },
  UNVERIFIED_EVIDENCE: { label: 'Có bằng chứng bị loại', short: 'căn cứ bị loại', tone: 'danger' },
} as const satisfies Record<string, { label: string; short: string; tone: BadgeTone }>
export type ScoreFlag = keyof typeof SCORE_FLAGS

/** Mức khớp của một tiêu chí (kickoff mục 8.4) */
export const MATCH_LEVEL = {
  1: { label: 'Khớp', tone: 'success' },
  0.5: { label: 'Một phần', tone: 'warning' },
  0: { label: 'Không thấy trong CV', tone: 'neutral' },
} as const satisfies Record<number, { label: string; tone: BadgeTone }>
export type MatchLevel = keyof typeof MATCH_LEVEL

/** Nguồn hồ sơ (API Contract 2.1) */
export const APPLICATION_SOURCE = {
  PUBLIC_FORM: { label: 'Trang tuyển dụng', phrase: 'qua trang tuyển dụng', tone: 'neutral' },
  HR_UPLOAD: { label: 'HR tải hộ', phrase: 'HR tải hộ', tone: 'info' },
  MATCH_INVITE: { label: 'Mời từ hồ sơ cũ', phrase: 'được mời từ hồ sơ cũ', tone: 'success' },
} as const satisfies Record<string, { label: string; phrase: string; tone: BadgeTone }>
export type ApplicationSource = keyof typeof APPLICATION_SOURCE

/** Cột được sort – khớp whitelist của BE */
export const APPLICATION_SORT_FIELDS = ['createdAt', 'score'] as const

/** Hỏi lại trạng thái AI mỗi 3 giây khi đang chấm (FE Architecture mục 9.3) */
export const AI_POLL_INTERVAL = 3_000

export const REJECT_REASONS = [
  'Chưa đủ kinh nghiệm',
  'Thiếu kỹ năng bắt buộc',
  'Không phù hợp văn hoá nhóm',
  'Mức lương không phù hợp',
  'Đã chọn ứng viên khác',
] as const

export const SCORE_GOOD = 70
export const SCORE_FAIR = 40

export const APPLICATION_VIEWS = [
  { id: 'all', label: 'Tất cả', params: {} },
  { id: 'new', label: 'Chờ xem', params: { status: 'NEW' } },
  { id: 'high', label: 'Điểm cao', params: { scoreMin: SCORE_GOOD } },
  { id: 'missing', label: 'Thiếu tiêu chí bắt buộc', params: { missingMust: 'true' } },
  { id: 'failed', label: 'Không đọc được', params: { aiStatus: 'FAILED' } },
] as const
export type ApplicationViewId = (typeof APPLICATION_VIEWS)[number]['id']
