const VN_OFFSET_MS = 7 * 3_600_000

/** ISO → giá trị cho <input type="datetime-local"> theo giờ máy người dùng */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Khoá ngày theo giờ Việt Nam để nhóm lịch phỏng vấn */
export const vnDay = (iso: string) =>
  new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)

const timeFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})
const dayFormat = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})

export const formatTime = (iso: string) => timeFormat.format(new Date(iso))
export const formatDay = (iso: string) => dayFormat.format(new Date(iso))

export function formatSlot(iso: string, minutes: number): string {
  const end = new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
  return `${formatTime(iso)}–${formatTime(end)} · ${formatDay(iso)}`
}

export const isLink = (value: string) => /^https?:\/\//i.test(value)

export const averageOverall = (scores: number[]) =>
  scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null
