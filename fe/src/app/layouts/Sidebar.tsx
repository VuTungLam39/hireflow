import { ExternalLink, X } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { hasPermission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { BrandMark } from './BrandMark'
import { navGroups } from './nav-config'

// Theme "Indigo Night" (FE Architecture 10): sidebar tối, tách khỏi khung main sáng
export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(user, item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {open && (
        <div
          aria-hidden
          className="animate-fade-in fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'bg-sidebar-surface text-sidebar-foreground fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-200 ease-out',
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            to={paths.home}
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          >
            <BrandMark onDark />
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            className="text-sidebar-muted hover:bg-sidebar-hover rounded-md p-1.5 hover:text-white md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5" aria-label="Điều hướng chính">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-sidebar-muted mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] uppercase">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                          'focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none',
                          isActive
                            ? 'bg-sidebar-active shadow-glow text-white'
                            : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden
                            className={cn(
                              'bg-accent absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <Icon
                            className={cn(
                              'size-[18px] transition-colors',
                              isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-white',
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

        <div className="border-sidebar-border border-t p-3">
          <Link
            to={paths.publicJobs}
            target="_blank"
            className="text-sidebar-muted hover:bg-sidebar-hover flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:text-white"
          >
            <ExternalLink className="size-[18px]" />
            Trang tuyển dụng
          </Link>
          <p className="text-sidebar-muted/70 px-3 pt-2 text-[11px]">
            HireFlow · ATS có bằng chứng
          </p>
        </div>
      </aside>
    </>
  )
}
