import {
  Activity,
  Briefcase,
  Building2,
  CalendarDays,
  Contact,
  FileText,
  LayoutDashboard,
  ScrollText,
  MessageSquareText,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Permission } from '@/lib/permissions'
import { paths } from '@/routes/paths'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission: Permission
  /** Chỉ active khi khớp đúng đường dẫn (trang chủ) */
  end?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Tuyển dụng',
    items: [
      {
        to: paths.home,
        label: 'Tổng quan',
        icon: LayoutDashboard,
        permission: Permission.DashboardRead,
        end: true,
      },
      { to: paths.jobs, label: 'Tin tuyển dụng', icon: Briefcase, permission: Permission.JobRead },
      {
        to: paths.applications,
        label: 'Hồ sơ ứng tuyển',
        icon: FileText,
        permission: Permission.ApplicationRead,
      },
      {
        to: paths.candidates,
        label: 'Kho ứng viên',
        icon: Contact,
        permission: Permission.CandidateRead,
      },
      {
        to: paths.interviews,
        label: 'Lịch phỏng vấn',
        icon: CalendarDays,
        permission: Permission.ApplicationRead,
      },
      {
        to: paths.aiChat,
        label: 'Trợ lý AI',
        icon: MessageSquareText,
        permission: Permission.AiChat,
      },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      { to: paths.users, label: 'Người dùng', icon: Users, permission: Permission.UserManage },
      {
        to: paths.departments,
        label: 'Phòng ban',
        icon: Building2,
        permission: Permission.DepartmentManage,
      },
      { to: paths.aiQueue, label: 'Hàng đợi AI', icon: Activity, permission: Permission.OpsManage },
      {
        to: paths.auditLogs,
        label: 'Nhật ký kiểm toán',
        icon: ScrollText,
        permission: Permission.AuditRead,
      },
    ],
  },
]

/** Mục menu ứng với đường dẫn hiện tại (khớp tiền tố dài nhất) để hiện breadcrumb trên topbar */
export function findNavItem(pathname: string): { group: string; item: NavItem } | null {
  let best: { group: string; item: NavItem } | null = null
  for (const group of navGroups) {
    for (const item of group.items) {
      const hit = item.end
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`)
      if (hit && (!best || item.to.length > best.item.to.length))
        best = { group: group.title, item }
    }
  }
  return best
}
