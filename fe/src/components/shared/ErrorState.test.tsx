import { render, screen } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import { ErrorState } from './ErrorState'

const apiError = (status: number, code: string, message = 'x') =>
  new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { success: false, statusCode: status, code, message, path: '/', timestamp: '' },
  })

describe('ErrorState', () => {
  it('P3-09: a 5xx message that already says "thử lại" is not repeated', () => {
    render(<ErrorState error={apiError(500, 'INTERNAL_ERROR')} onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Máy chủ gặp lỗi, vui lòng thử lại sau.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('giây lát')
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('P3-04: a 404 neither suggests retrying nor shows the retry button', () => {
    render(<ErrorState error={apiError(404, 'NOT_FOUND')} onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy dữ liệu.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('thử lại')
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
  })

  it('suggests retrying a network error', () => {
    render(<ErrorState error={new AxiosError('Network Error', 'ERR_NETWORK')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Bạn thử lại sau giây lát.')
  })
})
