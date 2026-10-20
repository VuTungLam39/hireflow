// Khớp với format response của backend (be/src/common/interfaces/api-response.interface.ts)

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiResponse<T> {
  success: true
  statusCode: number
  message: string
  data: T
  meta?: PaginationMeta
  timestamp: string
}

export interface FieldError {
  field: string
  messages: string[]
}

export interface ApiErrorResponse {
  success: false
  statusCode: number
  message: string
  errors?: FieldError[]
  path: string
  timestamp: string
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortOrder?: 'ASC' | 'DESC'
}
