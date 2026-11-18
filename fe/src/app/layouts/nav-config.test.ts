import { hasPermission } from '@/lib/permissions'
import { paths } from '@/routes/paths'
import { Role } from '@/types/user'
import { findNavItem, navGroups } from './nav-config'

const visibleGroups = (role: Role) =>
  navGroups
    .filter((g) => g.items.some((item) => hasPermission({ role }, item.permission)))
    .map((g) => g.title)

// BR-TEN-04
describe('navGroups by role', () => {
  it('shows the platform group only to the platform admin, and nothing else to them', () => {
    expect(visibleGroups(Role.PlatformAdmin)).toEqual(['Quản trị sàn'])
    for (const role of [Role.Admin, Role.Hr, Role.HiringManager, Role.Interviewer]) {
      expect(visibleGroups(role)).not.toContain('Quản trị sàn')
    }
  })
})

describe('findNavItem (breadcrumb topbar)', () => {
  it.each([
    ['/', 'Công việc', 'Hôm nay'],
    ['/applications', 'Công việc', 'Hồ sơ ứng tuyển'],
    ['/applications/abc', 'Công việc', 'Hồ sơ ứng tuyển'],
    ['/manage/jobs/abc/edit', 'Công việc', 'Tin tuyển dụng'],
    [paths.auditLogs, 'Quản trị', 'Nhật ký kiểm toán'],
    ['/platform/companies/abc', 'Quản trị sàn', 'Công ty'],
  ])('%s → %s › %s', (pathname, group, label) => {
    expect(findNavItem(pathname)).toMatchObject({ group, item: { label } })
  })

  it('does not treat a path that only shares a prefix as a match', () => {
    expect(findNavItem('/applicationsx')).toBeNull()
    expect(findNavItem('/unknown')).toBeNull()
  })
})
