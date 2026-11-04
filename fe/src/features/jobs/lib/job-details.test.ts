import { deadlineState, formatSalary, salaryOf } from './job-details'

const M = 1_000_000

describe('job details formatting (BR-JOB-08, BR-JOB-10)', () => {
  it.each([
    [{ mode: 'RANGE', min: 15 * M, max: 25 * M } as const, '15 – 25 triệu'],
    [{ mode: 'RANGE', min: 12_500_000, max: 20 * M } as const, '12,5 – 20 triệu'],
    [{ mode: 'RANGE', min: 20 * M, max: null } as const, 'Từ 20 triệu'],
    [{ mode: 'RANGE', min: null, max: 30 * M } as const, 'Đến 30 triệu'],
    [{ mode: 'NEGOTIABLE' } as const, 'Thoả thuận'],
    [null, null],
  ])('formats %o as %s', (salary, text) => {
    expect(formatSalary(salary)).toBe(text)
  })

  it('maps visibility exactly like the API: numbers only in RANGE mode', () => {
    expect(
      salaryOf({ salaryVisibility: 'HIDDEN', salaryMin: 10 * M, salaryMax: 20 * M }),
    ).toBeNull()
    expect(
      salaryOf({ salaryVisibility: 'NEGOTIABLE', salaryMin: 10 * M, salaryMax: 20 * M }),
    ).toEqual({
      mode: 'NEGOTIABLE',
    })
    expect(salaryOf({ salaryVisibility: 'RANGE', salaryMin: null, salaryMax: null })).toEqual({
      mode: 'NEGOTIABLE',
    })
  })

  it('counts deadline days in Vietnam time, including the 00:00 boundary', () => {
    // 04/11/2026 23:30 giờ Việt Nam = 16:30 UTC
    const lateEvening = new Date('2026-11-04T16:30:00Z')
    expect(deadlineState('2026-11-04', lateEvening)).toMatchObject({
      text: 'Hạn chót hôm nay',
      expired: false,
    })
    expect(deadlineState('2026-11-09', lateEvening)).toMatchObject({
      text: 'Còn 5 ngày',
      tone: 'muted',
    })
    expect(deadlineState('2026-11-06', lateEvening)).toMatchObject({ tone: 'warn' })
    // 05/11/2026 00:10 giờ Việt Nam
    const afterMidnight = new Date('2026-11-04T17:10:00Z')
    expect(deadlineState('2026-11-04', afterMidnight)).toMatchObject({
      text: 'Đã hết hạn nhận hồ sơ',
      expired: true,
    })
    expect(deadlineState(null)).toBeNull()
  })
})
