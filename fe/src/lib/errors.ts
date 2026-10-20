import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiErrorResponse } from '@/types/api'

/** Lấy thông báo lỗi dễ đọc từ lỗi API / lỗi bất kỳ */
export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (error.code === 'ERR_NETWORK') return 'Không kết nối được tới máy chủ'
    if (error.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá lâu'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * Gắn lỗi validate từ backend ({ field, messages }) vào đúng ô trong form.
 * Trả về true nếu có lỗi theo field được gắn.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!isAxiosError<ApiErrorResponse>(error)) return false
  const errors = error.response?.data?.errors
  if (!Array.isArray(errors) || errors.length === 0) return false

  for (const { field, messages } of errors) {
    setError(field as Path<T>, { type: 'server', message: messages[0] })
  }
  return true
}
