import type { BadgeTone } from '@/components/ui'

/** Nguồn sự thật cho trạng thái job (kickoff FR-JOB). Giá trị khớp BE. */
export const JOB_STATUS = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  OPEN: { label: 'Đang tuyển', tone: 'success' },
  CLOSED: { label: 'Đã đóng', tone: 'neutral' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type JobStatus = keyof typeof JOB_STATUS

/** Loại tiêu chí (kickoff mục 8.2) */
export const REQUIREMENT_TYPE = {
  MUST: { label: 'Bắt buộc', tone: 'warning' },
  NICE: { label: 'Nên có', tone: 'neutral' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>
export type RequirementType = keyof typeof REQUIREMENT_TYPE

/** Trọng số tiêu chí: số nguyên 1–3 (US-02) */
export const WEIGHT_MIN = 1
export const WEIGHT_MAX = 3

/** Cột được sort – khớp whitelist của BE */
export const JOB_SORT_FIELDS = ['createdAt', 'title', 'publishedAt'] as const

/** Nhóm trạng thái hồ sơ trong thanh pipeline của job (khớp JobPipeline của API) */
export const PIPELINE_STAGES = [
  { key: 'new', label: 'Mới', short: 'mới' },
  { key: 'inProgress', label: 'Đang xử lý', short: 'đang xử lý' },
  { key: 'hired', label: 'Đã nhận', short: 'nhận' },
  { key: 'closed', label: 'Đã loại', short: 'loại' },
] as const
