import { Outlet, useMatches } from 'react-router'
import { useMe } from '@/features/auth'
import { useRealtimeConnection } from '@/features/notifications'
import { cn } from '@/lib/utils'
import { DetailHost } from './DetailHost'
import { QuickSearch } from './QuickSearch'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export interface RouteHandle {
  fullWidth?: boolean
}

export function MainLayout() {
  useMe()
  useRealtimeConnection()
  const matches = useMatches()
  const fullWidth = matches.some((m) => (m.handle as RouteHandle | undefined)?.fullWidth)

  return (
    <div className="bg-canvas min-h-dvh md:flex">
      <a
        href="#main"
        className="bg-ink sr-only z-[70] rounded-sm px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Bỏ qua tới nội dung
      </a>
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="bg-surface md:border-line md:rounded-sheet flex-1 md:mr-2 md:mb-2 md:border">
          <main
            id="main"
            tabIndex={-1}
            className={cn(
              'mx-auto px-4 pt-6 pb-24 outline-none md:px-6 md:pt-8 lg:px-8',
              fullWidth ? 'max-w-none' : 'max-w-[1264px]',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <QuickSearch />
      <DetailHost />
    </div>
  )
}
