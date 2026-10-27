import {
  Activity,
  Briefcase,
  CalendarDays,
  Contact,
  Building2,
  ExternalLink,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Avatar } from '@/components/ui'
import { ChangePasswordDialog, useLogout, useMe } from '@/features/auth'
import { NotificationBell, useRealtimeConnection } from '@/features/notifications'
import { hasPermission, Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { ROLE_LABELS } from '@/types/user'
import { BrandMark } from './BrandMark'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission: Permission
  /** Chỉ active khi khớp đúng đường dẫn (trang chủ) */
  end?: boolean
}

const navGroups: { title: string; items: NavItem[] }[] = [
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
      { to: paths.aiChat, label: 'Trợ lý AI', icon: Sparkles, permission: Permission.AiChat },
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

export function MainLayout() {
  useMe() // làm mới thông tin user mỗi khi vào app
  useRealtimeConnection()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [changingPassword, setChangingPassword] = useState(false)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const { pathname } = useLocation()

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="min-h-screen md:flex">
      {/* Lớp nền mờ khi mở ngăn kéo trên mobile */}
      {sidebarOpen && (
        <div
          aria-hidden
          className="animate-fade-in fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 ease-out',
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to={paths.home}>
            <BrandMark />
          </Link>
          <div className="hidden md:block">
            <NotificationBell />
          </div>
          <button
            type="button"
            aria-label="Đóng menu"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      // Chọn trang thì đóng ngăn kéo trên mobile
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-primary-soft text-primary'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Vạch chỉ báo trang đang mở */}
                          <span
                            aria-hidden
                            className={cn(
                              'bg-primary absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <Icon
                            className={cn(
                              'size-[18px] transition-colors',
                              isActive
                                ? 'text-primary'
                                : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-slate-100 p-3">
          <Link
            to={paths.publicJobs}
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <ExternalLink className="size-[18px] text-slate-400" />
            Trang tuyển dụng
          </Link>
          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Avatar name={user.fullName} size="sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-slate-800">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">
                  {ROLE_LABELS[user.role]}
                  {user.department && ` · ${user.department.name}`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đổi mật khẩu"
                title="Đổi mật khẩu"
                onClick={() => setChangingPassword(true)}
                className="hover:text-primary rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <KeyRound className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Đăng xuất"
                title="Đăng xuất"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <ChangePasswordDialog open={changingPassword} onClose={() => setChangingPassword(false)} />

      <div className="min-w-0 flex-1">
        {/* Thanh trên chỉ cần ở mobile: nút mở menu + logo */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <BrandMark />
          <div className="ml-auto">
            <NotificationBell align="right" />
          </div>
        </header>

        {/* key theo đường dẫn: mỗi lần đổi trang nội dung hiện ra nhẹ nhàng */}
        <main
          key={pathname}
          className="animate-slide-up mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
