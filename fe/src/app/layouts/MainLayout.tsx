import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui'
import { useLogout, useMe } from '@/features/auth'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'

interface NavItem {
  to: string
  label: string
  /** Bỏ trống = ai đăng nhập cũng thấy */
  roles?: Role[]
}

const navItems: NavItem[] = [
  { to: paths.home, label: 'Trang chủ' },
  { to: paths.users, label: 'Người dùng', roles: [Role.Admin] },
]

export function MainLayout() {
  useMe() // làm mới thông tin user mỗi khi vào app
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="text-primary font-semibold">NCC Intern</span>
            <nav className="flex gap-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100',
                      isActive && 'bg-slate-100 text-slate-900',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.fullName}</span>
            <Button
              variant="secondary"
              size="sm"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
