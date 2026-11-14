import { api } from '@/lib/api-client'
import { publicJobsApi } from './public-jobs.api'

// P1-01: ứng viên nộp CV qua mạng chậm hoặc lúc API đang thức dậy không bị cắt ở 15 giây mặc định
it('gives the CV upload more time than the default request timeout', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
  const cv = new File(['cv'], 'cv.pdf', { type: 'application/pdf' })
  await publicJobsApi.apply('job-1', {
    fullName: 'A',
    email: 'a@example.com',
    phone: '0900000000',
    consent: true,
    website: '',
    cv,
  })
  const config = post.mock.calls[0][2]
  expect(config?.timeout).toBeGreaterThanOrEqual(60_000)
  expect(config!.timeout!).toBeGreaterThan(api.defaults.timeout!)
  post.mockRestore()
})
