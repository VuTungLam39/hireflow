import { ArrowUpRight, X } from 'lucide-react'
import { Link } from 'react-router'
import { Tooltip } from '@/components/ui'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { BrandMark } from './BrandMark'
import type { RailGroup } from './use-nav-groups'

interface RailProps {
  groups: RailGroup[]
  activeId?: string
}

export function Rail({ groups, activeId }: RailProps) {
  const user = useAuthStore((s) => s.user)
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const railOnly = useMediaQuery('(min-width: 48rem) and (max-width: 63.99rem)')

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
              <p className="text-rail-muted mb-1.5 px-2.5 text-[13px] font-medium md:max-lg:sr-only">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ id, href, label, icon: Icon, badgeCount: count }) => {
                  const isActive = id === activeId
                  return (
                    <li key={id}>
                      <Tooltip label={label} side="right" className="flex" disabled={!railOnly}>
                        <Link
                          to={href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={count ? `${label}, ${count} hồ sơ chờ xem` : undefined}
                          className={cn(
                            'focus-visible:outline-marker relative flex h-9 w-full items-center gap-3 rounded-sm px-2.5 text-sm transition-colors duration-150',
                            'md:justify-center md:px-0 lg:justify-start lg:px-2.5',
                            isActive
                              ? 'bg-rail-hover font-semibold text-white'
                              : 'text-rail-text hover:bg-rail-hover/70 font-normal hover:text-white',
                          )}
                        >
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
                          <span className="truncate md:max-lg:sr-only">{label}</span>
                          {count != null && count > 0 && (
                            <span className="num text-rail-muted ml-auto text-xs md:absolute md:top-0.5 md:right-1 md:ml-0 lg:static lg:ml-auto">
                              {count > 999 ? '999+' : count.toLocaleString('vi-VN')}
                            </span>
                          )}
                        </Link>
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-rail-line border-t p-2.5">
          {user?.organization && (
            <p
              className="text-rail-text truncate px-2.5 pb-2 text-[13px] font-medium md:max-lg:sr-only"
              title={user.organization.name}
            >
              {user.organization.name}
            </p>
          )}
          <Link
            to={paths.publicJobs}
            target="_blank"
            className="text-rail-muted hover:bg-rail-hover/70 flex h-9 items-center gap-3 rounded-sm px-2.5 text-sm transition-colors hover:text-white md:justify-center md:px-0 lg:justify-start lg:px-2.5"
          >
            <ArrowUpRight className="size-[18px] shrink-0" />
            <span className="md:max-lg:sr-only">Trang tuyển dụng</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
