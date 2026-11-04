import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDaysAgo,
  formatRelative,
  formatTime,
  formatTimeOnDate,
} from './utils'

// 2026-10-27T07:30Z = 14:30 giờ Việt Nam
const iso = '2026-10-27T07:30:00.000Z'

describe('định dạng ngày giờ (Design Spec mục 8)', () => {
  it('luôn theo giờ Việt Nam, ngày tháng có số 0 đứng đầu, năm 4 chữ số', () => {
    expect(formatDate(iso)).toBe('27/10/2026')
    expect(formatTime(iso)).toBe('14:30')
    expect(formatDateTime(iso)).toBe('27/10/2026, 14:30')
    expect(formatTimeOnDate(iso)).toBe('14:30 ngày 27/10/2026')
  })

  it('đổi ngày theo giờ Việt Nam, không theo UTC', () => {
    expect(formatDateTime('2026-11-02T18:05:00.000Z')).toBe('03/11/2026, 01:05')
    expect(formatDate('2026-03-05T00:00:00.000Z')).toBe('05/03/2026')
  })

  it('độ tươi theo ngày lịch giờ Việt Nam, viết thường để đứng giữa câu', () => {
    const now = new Date('2026-11-03T03:00:00.000Z') // 10:00 ngày 03/11 giờ VN
    expect(formatDaysAgo('2026-11-02T18:30:00.000Z', now)).toBe('hôm nay') // 01:30 ngày 03/11
    expect(formatDaysAgo('2026-11-02T16:00:00.000Z', now)).toBe('hôm qua') // 23:00 ngày 02/11
    expect(formatDaysAgo('2026-10-31T03:00:00.000Z', now)).toBe('3 ngày trước')
    expect(formatDaysAgo(null, now)).toBe('—')
    expect(formatRelative(new Date(Date.now() - 86_400_000).toISOString())).toBe('hôm qua')
  })

  it('giá trị rỗng hiện gạch ngang', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })
})
