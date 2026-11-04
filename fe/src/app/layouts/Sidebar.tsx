import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, X } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { Tooltip } from '@/components/ui'
import { applicationQueries } from '@/features/applications'
import { useMediaQuery } from '@/hooks/use-media-query'
import { usePermission } from '@/hooks/use-permission'
import { hasPermission, Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { BrandMark } from './BrandMark'
import { navGroups } from './nav-config'

function usePendingCount() {
  const allowed = usePermission(Permission.ApplicationRead)
  const query = useQuery({
    ...applicationQueries.list({
      page: 1,
      limit: 1,
      status: 'NEW',
      sortBy: 'createdAt',
      order: 'DESC',
    }),
    enabled: allowed,
    staleTime: 60_000,
  })
  return query.data?.meta?.totalItems
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const pending = usePendingCount()
  const railOnly = useMediaQuery('(min-width: 48rem) and (max-width: 63.99rem)')

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
          className="bg-ink/40 fixed inset-0 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        aria-label="Thanh điều hướng"
        className={cn(
          'bg-rail text-rail-text fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col transition-transform duration-200 ease-(--ease-standard)',
          'md:sticky md:top-0 md:h-dvh md:w-16 md:translate-x-0 lg:w-[232px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4 md:justify-center md:px-0 lg:justify-start lg:px-4">
          <Link to={paths.home} aria-label="HireFlow – Hôm nay" className="rounded-sm">
            <BrandMark onDark className="md:hidden lg:inline-flex" />
            <BrandMark onDark compact className="hidden md:inline-flex lg:hidden" />
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            className="text-rail-muted hover:bg-rail-hover rounded-sm p-1.5 hover:text-white md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-2.5 py-4" aria-label="Điều hướng chính">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-rail-muted mb-1.5 px-2.5 text-xs font-semibold tracking-[0.08em] uppercase md:sr-only lg:not-sr-only">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end, badge }) => {
                  const count = badge === 'pending' ? pending : undefined
                  return (
                    <li key={to}>
                      <Tooltip label={label} side="right" className="flex" disabled={!railOnly}>
                        <NavLink
                          to={to}
                          end={end}
                          onClick={() => setOpen(false)}
                          aria-label={count ? `${label}, ${count} hồ sơ chờ xem` : undefined}
                          className={({ isActive }) =>
                            cn(
                              'focus-visible:outline-marker relative flex h-9 w-full items-center gap-3 rounded-sm px-2.5 text-sm transition-colors duration-150',
                              'md:justify-center md:px-0 lg:justify-start lg:px-2.5',
                              isActive
                                ? 'bg-rail-hover font-semibold text-white'
                                : 'text-rail-text hover:bg-rail-hover/70 font-normal hover:text-white',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span
                                  aria-hidden
                                  className="bg-marker absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-xs"
                                />
                              )}
                              <Icon
                                className={cn(
                                  'size-[18px] shrink-0',
                                  isActive ? 'text-white' : 'text-rail-muted',
                                )}
                              />
                              <span className="truncate md:sr-only lg:not-sr-only">{label}</span>
                              {count != null && count > 0 && (
                                <span className="num text-rail-muted ml-auto text-xs md:absolute md:top-0.5 md:right-1 md:ml-0 lg:static lg:ml-auto">
                                  {count > 999 ? '999+' : count.toLocaleString('vi-VN')}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-rail-line border-t p-2.5">
          <Link
            to={paths.publicJobs}
            target="_blank"
            className="text-rail-muted hover:bg-rail-hover/70 flex h-9 items-center gap-3 rounded-sm px-2.5 text-sm transition-colors hover:text-white md:justify-center md:px-0 lg:justify-start lg:px-2.5"
          >
            <ArrowUpRight className="size-[18px] shrink-0" />
            <span className="md:sr-only lg:not-sr-only">Trang tuyển dụng</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
