import { AxiosError, AxiosHeaders } from 'axios'
import { getErrorMessage } from './errors'

const apiError = (code: string, errors?: { field: string; messages: string[] }[]) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { success: false, statusCode: 409, code, message: 'x', errors, path: '/', timestamp: '' },
  })

describe('getErrorMessage', () => {
  it('prefers the specific reason the API sends over the generic message of the code', () => {
    const error = apiError('JOB_NOT_PUBLISHABLE', [
      { field: 'deadline', messages: ['Hạn nộp đã qua. Đổi hạn nộp trước khi đăng tin'] },
    ])
    expect(getErrorMessage(error)).toBe('Hạn nộp đã qua. Đổi hạn nộp trước khi đăng tin')
  })

  it('keeps the generic message when there is no specific reason, or for form validation', () => {
    expect(getErrorMessage(apiError('JOB_NOT_PUBLISHABLE'))).toBe(
      'Chỉ đăng được tin ở trạng thái Nháp và có ít nhất 1 tiêu chí',
    )
    const validation = apiError('VALIDATION_FAILED', [{ field: 'title', messages: ['Quá ngắn'] }])
    expect(getErrorMessage(validation)).not.toBe('Quá ngắn')
  })
})
