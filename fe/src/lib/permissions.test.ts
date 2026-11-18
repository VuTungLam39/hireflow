import { Role } from '@/types/user'
import { hasPermission, Permission } from './permissions'

describe('permissions', () => {
  it('admin has every permission except platform:manage (KH MVP 3 mục 4)', () => {
    for (const p of Object.values(Permission)) {
      expect(hasPermission({ role: Role.Admin }, p)).toBe(p !== Permission.PlatformManage)
    }
  })

  it('BR-TEN-04: the platform admin only manages the platform', () => {
    for (const p of Object.values(Permission)) {
      expect(hasPermission({ role: Role.PlatformAdmin }, p)).toBe(p === Permission.PlatformManage)
    }
  })

  it('HR cannot approve offers or manage users', () => {
    expect(hasPermission({ role: Role.Hr }, Permission.ApplicationApproveOffer)).toBe(false)
    expect(hasPermission({ role: Role.Hr }, Permission.UserManage)).toBe(false)
    expect(hasPermission({ role: Role.Hr }, Permission.ApplicationUpdateStatus)).toBe(true)
  })

  it('hiring manager can approve offers but not change status', () => {
    const hm = { role: Role.HiringManager }
    expect(hasPermission(hm, Permission.ApplicationApproveOffer)).toBe(true)
    expect(hasPermission(hm, Permission.ApplicationUpdateStatus)).toBe(false)
  })

  it('HR uploads CVs for candidates; only admin anonymizes (BR-APP-10, BR-DATA-03)', () => {
    expect(hasPermission({ role: Role.Hr }, Permission.ApplicationCreate)).toBe(true)
    expect(hasPermission({ role: Role.Hr }, Permission.CandidateAnonymize)).toBe(false)
    expect(hasPermission({ role: Role.HiringManager }, Permission.ApplicationCreate)).toBe(false)
    expect(hasPermission({ role: Role.HiringManager }, Permission.CandidateAnonymize)).toBe(false)
    expect(hasPermission({ role: Role.Admin }, Permission.CandidateAnonymize)).toBe(true)
  })

  it('prefers permissions returned by the backend', () => {
    const user = { role: Role.Hr, permissions: [Permission.JobRead] }
    expect(hasPermission(user, Permission.JobCreate)).toBe(false)
  })

  it('guests have nothing', () => {
    expect(hasPermission(null, Permission.JobRead)).toBe(false)
  })
})
