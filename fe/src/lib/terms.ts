import { createContext, useContext } from 'react'

/** GLOSSARY "Thuật ngữ giao diện" – nhãn dùng nguyên văn, không tự đặt nhãn mới trong component */

export const APPLICATION_STATUS_LABEL = {
  NEW: { internal: 'Mới', public: 'Đã nhận hồ sơ' },
  SCREENING: { internal: 'Sàng lọc', public: 'Đang xem xét' },
  INTERVIEW: { internal: 'Phỏng vấn', public: 'Mời phỏng vấn' },
  OFFER: { internal: 'Offer', public: 'Đã có kết quả' },
  HIRED: { internal: 'Đã nhận việc', public: 'Đã có kết quả' },
  REJECTED: { internal: 'Từ chối', public: 'Đã có kết quả' },
  WITHDRAWN: { internal: 'Ứng viên rút', public: 'Bạn đã rút hồ sơ' },
} as const

export const SCORE_FLAG_LABEL = {
  MISSING_MUST: 'Thiếu tiêu chí bắt buộc',
  UNVERIFIED_EVIDENCE: 'Có căn cứ bị loại',
} as const

// DL-11
export type Surface = 'internal' | 'public'

const JOB_NOUN = {
  internal: { label: 'Tin tuyển dụng', count: 'tin' },
  public: { label: 'Việc làm', count: 'vị trí' },
} as const

export const SurfaceContext = createContext<Surface>('internal')

export const useSurface = () => useContext(SurfaceContext)
export const useJobNoun = () => JOB_NOUN[useSurface()]
