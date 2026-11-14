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

export const JOB_CONFIRM = {
  publish: {
    title: 'Đăng tin tuyển dụng?',
    description: 'Tin sẽ hiện ngay trên trang tuyển dụng công khai và bắt đầu nhận hồ sơ.',
    label: 'Đăng tin',
  },
  close: {
    title: 'Đóng tin tuyển dụng?',
    description:
      'Tin ngừng nhận hồ sơ mới và không mở lại được; hồ sơ đã có vẫn xử lý bình thường. Cần tuyển tiếp thì tạo tin mới.',
    label: 'Đóng tin',
  },
  delete: {
    title: 'Xoá tin nháp?',
    description: 'Tin chưa có hồ sơ nào nên xoá được. Tin sẽ biến mất khỏi danh sách.',
    label: 'Xoá tin nháp',
  },
} as const

// F-JOB-10 · BR-JOB-08: giá trị khớp BE
export const JOB_LEVEL = {
  INTERN: 'Thực tập sinh',
  FRESHER: 'Mới tốt nghiệp',
  JUNIOR: 'Junior',
  MIDDLE: 'Middle',
  SENIOR: 'Senior',
  LEAD: 'Trưởng nhóm',
  MANAGER: 'Quản lý',
} as const
export type JobLevel = keyof typeof JOB_LEVEL

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERNSHIP: 'Thực tập',
} as const
export type EmploymentType = keyof typeof EMPLOYMENT_TYPE

export const WORK_MODE = {
  ONSITE: 'Tại văn phòng',
  HYBRID: 'Hybrid',
  REMOTE: 'Từ xa',
} as const
export type WorkMode = keyof typeof WORK_MODE

export const SALARY_VISIBILITY = {
  RANGE: 'Hiện khoảng lương',
  NEGOTIABLE: 'Hiện "Thoả thuận"',
  HIDDEN: 'Không hiện lương',
} as const
export type SalaryVisibility = keyof typeof SALARY_VISIBILITY

export const HEADCOUNT_MAX = 999
export const BENEFITS_MAX = 5000
/** Cùng giới hạn với BE (SALARY_LIMIT, REQUIREMENTS ArrayMaxSize) */
export const SALARY_MAX_MILLION = 2000
export const REQUIREMENTS_MAX = 20
export const KEYWORDS_MAX = 20
export const KEYWORD_LENGTH_MAX = 50
