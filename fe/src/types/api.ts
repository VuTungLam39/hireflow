// Khớp với format response của backend (be/src/common/interfaces/api-response.interface.ts)

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** M: kiểu meta – PaginationMeta (offset) hoặc CursorMeta (cursor) */
export interface ApiResponse<T, M = PaginationMeta> {
  success: true
  statusCode: number
  message: string
  data: T
  meta?: M
  timestamp: string
}

export interface FieldError {
  field: string
  messages: string[]
}

export interface ApiErrorResponse {
  success: false
  statusCode: number
  /** Mã lỗi nghiệp vụ (Backend Architecture mục 11), ví dụ INVALID_STATUS_TRANSITION */
  code?: string
  message: string
  errors?: FieldError[]
  path: string
  timestamp: string
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

/** meta của danh sách phân trang cursor (API Contract 4.11) */
export interface CursorMeta {
  limit: number
  /** Chuỗi mờ: FE chỉ gửi lại đúng giá trị này để lấy trang sau */
  nextCursor: string | null
  hasNextPage: boolean
}

export interface CursorPage<T> {
  items: T[]
  meta: CursorMeta
}

export type SortOrder = 'ASC' | 'DESC'

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

/** Tham số sort: `sortBy` phải nằm trong whitelist của từng API (kickoff mục 10.1) */
export interface SortParams<F extends string = string> {
  sortBy?: F
  order?: SortOrder
}
