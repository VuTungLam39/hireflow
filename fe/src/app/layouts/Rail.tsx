import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { NavSheet, Tooltip } from '@/components/ui'
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

// Contract Rail: full ≥1100 · icon 600–1100 · compact <600 (menu → NavSheet)
export const RAIL_COMPACT = '(max-width: 599.98px)'
const RAIL_ICON = '(min-width: 600px) and (max-width: 1099.98px)'

function RailNav({ groups, activeId, iconMode }: RailProps & { iconMode: boolean }) {
  const user = useAuthStore((s) => s.user)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const label = 'min-[600px]:max-[1099.98px]:sr-only'

  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto px-2.5 py-4" aria-label="Điều hướng chính">
        {groups.map((group) => (
          <div key={group.title}>
            <p className={cn('text-rail-muted mb-1.5 px-2.5 text-[13px] font-medium', label)}>
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, href, label: text, icon: Icon, badgeCount: count }) => {
                const isActive = id === activeId
                return (
                  <li key={id}>
                    <Tooltip label={text} side="right" className="flex" disabled={!iconMode}>
                      <Link
                        to={href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={count ? `${text}, ${count} hồ sơ chờ xem` : undefined}
                        className={cn(
                          'focus-visible:outline-marker relative flex h-9 w-full items-center gap-3 rounded-sm px-2.5 text-sm transition-colors duration-150',
                          'min-[600px]:max-[1099.98px]:justify-center min-[600px]:max-[1099.98px]:px-0',
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
                        <span className={cn('truncate', label)}>{text}</span>
                        {count != null && count > 0 && (
                          <span className="num text-rail-muted ml-auto text-xs min-[600px]:max-[1099.98px]:absolute min-[600px]:max-[1099.98px]:top-0.5 min-[600px]:max-[1099.98px]:right-1 min-[600px]:max-[1099.98px]:ml-0">
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
            className={cn('text-rail-text truncate px-2.5 pb-2 text-[13px] font-medium', label)}
            title={user.organization.name}
          >
            {user.organization.name}
          </p>
        )}
        <Link
          to={paths.publicJobs}
          target="_blank"
          className="text-rail-muted hover:bg-rail-hover/70 flex h-9 items-center gap-3 rounded-sm px-2.5 text-sm transition-colors hover:text-white min-[600px]:max-[1099.98px]:justify-center min-[600px]:max-[1099.98px]:px-0"
        >
          <ArrowUpRight className="size-[18px] shrink-0" />
          <span className={label}>Trang tuyển dụng</span>
        </Link>
      </div>
    </>
  )
}

export function Rail({ groups, activeId }: RailProps) {
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const compact = useMediaQuery(RAIL_COMPACT)
  const iconMode = useMediaQuery(RAIL_ICON)

  if (compact)
    return (
      <NavSheet open={open} onOpenChange={setOpen} title="Menu">
        <div className="bg-rail text-rail-text flex min-h-full flex-col">
          <RailNav groups={groups} activeId={activeId} iconMode={false} />
        </div>
      </NavSheet>
    )

  return (
    <aside
      aria-label="Thanh điều hướng"
      className="bg-rail text-rail-text sticky top-0 flex h-dvh w-16 shrink-0 flex-col min-[1100px]:w-[232px]"
    >
      <div className="flex h-14 shrink-0 items-center justify-center px-0 min-[1100px]:justify-start min-[1100px]:px-4">
        <Link to={paths.home} aria-label="HireFlow – Hôm nay" className="rounded-sm">
          <BrandMark onDark className="hidden min-[1100px]:inline-flex" />
          <BrandMark onDark compact className="min-[1100px]:hidden" />
        </Link>
      </div>
      <RailNav groups={groups} activeId={activeId} iconMode={iconMode} />
    </aside>
  )
}
