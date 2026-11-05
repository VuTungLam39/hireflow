import { APPLICATION_STATUS, type ApplicationStatus } from '@/features/applications'
import { ROLE_LABELS, type Role } from '@/types/user'
import type { AuditAction, AuditLogItem } from './types'

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CV_VIEWED: 'Xem CV gốc',
  CV_TEXT_ENTERED: 'Nhập nội dung CV',
  APPLICATION_STATUS_CHANGED: 'Đổi trạng thái hồ sơ',
  CANDIDATE_ANONYMIZED: 'Ẩn danh ứng viên',
  USER_CREATED: 'Tạo người dùng',
  USER_UPDATED: 'Đổi quyền người dùng',
  USER_DELETED: 'Xoá người dùng',
  TOKEN_REUSE_DETECTED: 'Phát hiện dùng lại phiên đăng nhập',
  COMPANY_PROFILE_UPDATED: 'Sửa hồ sơ công ty',
  COMPANY_MEDIA_ADDED: 'Thêm ảnh công ty',
  COMPANY_MEDIA_REMOVED: 'Xoá ảnh công ty',
  APPLICATIONS_EXPORTED: 'Xuất CSV hồ sơ',
}

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]

const statusLabel = (s: unknown) => APPLICATION_STATUS[s as ApplicationStatus]?.label ?? String(s)
/** E6: "status=NEW&search=an" → "trạng thái Mới, tìm “an”" */
function describeFilters(filters: unknown) {
  const p = new URLSearchParams(typeof filters === 'string' ? filters : '')
  const parts = [
    p.get('status') && `trạng thái ${statusLabel(p.get('status'))}`,
    p.get('jobId') && 'một tin',
    p.get('missingMust') && 'thiếu tiêu chí bắt buộc',
    p.get('bucket') === 'other' && 'hồ sơ mới khác',
    (p.get('scoreMin') || p.get('scoreMax')) &&
      `điểm ${p.get('scoreMin') ?? 0}–${p.get('scoreMax') ?? 100}`,
    (p.get('createdFrom') || p.get('createdTo')) &&
      `nộp ${p.get('createdFrom') ?? '…'} → ${p.get('createdTo') ?? '…'}`,
    p.get('aiStatus') && 'theo trạng thái đọc CV',
    p.get('search') && `tìm “${p.get('search')}”`,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'không lọc'
}

const roleLabel = (r: unknown) => (r ? (ROLE_LABELS[r as Role] ?? String(r)) : '–')

export function describeAudit(log: AuditLogItem): string {
  const m = log.metadata
  switch (log.action) {
    case 'APPLICATION_STATUS_CHANGED':
      return [
        `${statusLabel(m.from)} → ${statusLabel(m.to)}`,
        m.reopen ? '(mở lại)' : null,
        m.reason ? `· Lý do: ${m.reason}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    case 'CV_TEXT_ENTERED':
      return `${Number(m.length).toLocaleString('vi-VN')} ký tự`
    case 'CANDIDATE_ANONYMIZED':
      return m.reason === 'retention' ? 'Tự động khi hết hạn lưu CV' : 'Theo yêu cầu của ứng viên'
    case 'USER_CREATED':
      return `Vai trò ${roleLabel(m.role)}`
    case 'USER_UPDATED': {
      const parts: string[] = []
      if ('roleTo' in m) parts.push(`Vai trò ${roleLabel(m.roleFrom)} → ${roleLabel(m.roleTo)}`)
      if ('departmentTo' in m) parts.push('Đổi phòng ban')
      if ('isActive' in m) parts.push(m.isActive ? 'Mở khoá tài khoản' : 'Khoá tài khoản')
      if (m.passwordReset) parts.push('Đặt lại mật khẩu')
      return parts.join(' · ')
    }
    case 'APPLICATIONS_EXPORTED':
      return `${Number(m.rows).toLocaleString('vi-VN')} hồ sơ · Bộ lọc: ${describeFilters(m.filters)}`
    case 'TOKEN_REUSE_DETECTED':
      return 'Phiên đăng nhập đã thu hồi bị dùng lại; mọi phiên liên quan đã bị đăng xuất'
    default:
      return ''
  }
}

export function formatIp(ip: string | null | undefined) {
  if (!ip) return null
  const v4 = ip.replace(/^::ffff:/, '')
  return v4 === '::1' || v4 === '127.0.0.1' ? 'máy nội bộ' : `IP ${v4}`
}
