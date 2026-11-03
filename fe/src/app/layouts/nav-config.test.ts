import { paths } from '@/routes/paths'
import { findNavItem } from './nav-config'

describe('findNavItem (breadcrumb topbar)', () => {
  it.each([
    ['/', 'Công việc', 'Hôm nay'],
    ['/applications', 'Công việc', 'Hồ sơ ứng tuyển'],
    ['/applications/abc', 'Công việc', 'Hồ sơ ứng tuyển'],
    ['/manage/jobs/abc/edit', 'Công việc', 'Tin tuyển dụng'],
    [paths.auditLogs, 'Quản trị', 'Nhật ký kiểm toán'],
  ])('%s → %s › %s', (pathname, group, label) => {
    expect(findNavItem(pathname)).toMatchObject({ group, item: { label } })
  })

  it('does not treat a path that only shares a prefix as a match', () => {
    expect(findNavItem('/applicationsx')).toBeNull()
    expect(findNavItem('/unknown')).toBeNull()
  })
})
