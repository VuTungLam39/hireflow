import { Outlet, useMatches } from 'react-router'
import { useMe } from '@/features/auth'
import { useFocusMainOnNavigate } from '@/hooks/use-focus-main'
import { useRealtimeConnection } from '@/features/notifications'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { DetailHost } from './DetailHost'
import { QuickSearch } from './QuickSearch'
import { Rail } from './Rail'
import { Topbar } from './Topbar'
import { useNavGroups } from './use-nav-groups'

export interface RouteHandle {
  fullWidth?: boolean
}

export function AppShell() {
  useMe()
  useRealtimeConnection()
  useFocusMainOnNavigate()
  const matches = useMatches()
  const fullWidth = matches.some((m) => (m.handle as RouteHandle | undefined)?.fullWidth)
  const { groups, activeId } = useNavGroups()
  const pending = useAuthStore((s) => s.user?.organization?.status === 'PENDING')

  return (
    <div className="bg-canvas min-h-dvh md:flex">
      <a
        href="#main"
        className="bg-ink sr-only z-[70] rounded-sm px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Bỏ qua tới nội dung
      </a>
      <Rail groups={groups} activeId={activeId} />
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
            {pending && (
              // BR-ORG-04, KH MVP 3 mục 8.3
              <p
                role="note"
                className="border-warn/30 bg-warn-soft text-ink-2 mb-6 rounded-md border px-4 py-3 text-sm"
              >
                <span className="text-ink font-medium">Công ty đang chờ Quản trị sàn duyệt.</span>{' '}
                Bạn vẫn chuẩn bị phòng ban, người dùng và tin tuyển dụng được; tin chỉ hiện công
                khai sau khi được duyệt.
              </p>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      <QuickSearch />
      <DetailHost />
    </div>
  )
}
