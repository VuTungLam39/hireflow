import { APPLICATION_STATUS, type ApplicationStatus } from '@/features/applications'
import { ROLE_LABELS, type Role } from '@/types/user'
import type { AuditAction, AuditLogItem } from './types'

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CV_VIEWED: 'Xem CV gốc',
  CV_TEXT_ENTERED: 'Nhập text CV',
  APPLICATION_STATUS_CHANGED: 'Đổi trạng thái hồ sơ',
  CANDIDATE_ANONYMIZED: 'Ẩn danh ứng viên',
  USER_CREATED: 'Tạo người dùng',
  USER_UPDATED: 'Đổi quyền người dùng',
  USER_DELETED: 'Xoá người dùng',
  TOKEN_REUSE_DETECTED: 'Phát hiện dùng lại phiên đăng nhập',
}

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]

const statusLabel = (s: unknown) => APPLICATION_STATUS[s as ApplicationStatus]?.label ?? String(s)
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
      return parts.join(' · ') || '–'
    }
    case 'TOKEN_REUSE_DETECTED':
      return 'Refresh token đã thu hồi bị dùng lại; mọi phiên của chuỗi đã bị đăng xuất'
    default:
      return '–'
  }
}
