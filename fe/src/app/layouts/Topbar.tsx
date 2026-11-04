import { Menu, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Kbd } from '@/components/ui'
import { NotificationBell } from '@/features/notifications'
import { useUiStore } from '@/stores/ui.store'
import { BrandMark } from './BrandMark'
import { QUICK_SEARCH_LABEL, useQuickSearchScope } from './quick-search-scope'
import { findNavItem } from './nav-config'
import { UserMenu } from './UserMenu'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Topbar() {
  const { pathname } = useLocation()
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const crumb = useUiStore((s) => s.crumb)
  const searchLabel = QUICK_SEARCH_LABEL[useQuickSearchScope()]
  const current = findNavItem(pathname)
  const isDetail = !!current && pathname !== current.item.to

  return (
    <header className="bg-canvas sticky top-0 z-20">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Mở menu"
          className="text-ink-2 hover:bg-sunken -ml-1.5 rounded-sm p-2 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="md:hidden" aria-label="HireFlow – Hôm nay">
          <BrandMark size="sm" />
        </Link>

        {current && (
          <nav aria-label="Vị trí hiện tại" className="hidden min-w-0 md:block">
            <ol className="type-caption flex items-center gap-1.5">
              <li>{current.group}</li>
              <li aria-hidden className="text-ink-faint">
                /
              </li>
              {isDetail ? (
                <>
                  <li className="truncate">
                    <Link
                      to={crumb?.back ?? current.item.to}
                      className="hover:text-ink transition-colors"
                    >
                      {current.item.label}
                    </Link>
                  </li>
                  <li aria-hidden className="text-ink-faint">
                    /
                  </li>
                  <li aria-current="page" className="text-ink max-w-80 truncate">
                    {crumb?.title ?? 'Chi tiết'}
                  </li>
                </>
              ) : (
                <li aria-current="page" className="text-ink truncate">
                  {current.item.label}
                </li>
              )}
            </ol>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-line-strong bg-surface text-ink-muted hover:border-ink-faint hidden h-9 w-64 items-center gap-2 rounded-sm border pr-1.5 pl-3 text-sm transition-colors lg:flex xl:w-72"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">{searchLabel}</span>
            <Kbd>{isMac ? '⌘' : 'Ctrl'} K</Kbd>
          </button>
          <button
            type="button"
            aria-label={searchLabel}
            onClick={() => setCommandOpen(true)}
            className="text-ink-2 hover:bg-sunken rounded-sm p-2 lg:hidden"
          >
            <Search className="size-5" />
          </button>
          <NotificationBell align="right" />
          <span aria-hidden className="bg-line mx-1 hidden h-6 w-px sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
