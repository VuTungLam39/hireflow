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

  it('never shows the raw English axios message, e.g. a 502 while the API restarts', () => {
    const gateway = new AxiosError(
      'Request failed with status code 502',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 502,
        statusText: 'Bad Gateway',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: '',
      },
    )
    expect(getErrorMessage(gateway)).toBe('Máy chủ tạm thời không phản hồi')
    const unknown = new AxiosError('Request failed with status code 418')
    expect(getErrorMessage(unknown)).toBe('Có trục trặc khi tải dữ liệu')
  })
})
