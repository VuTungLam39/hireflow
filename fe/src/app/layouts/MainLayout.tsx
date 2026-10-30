import { Outlet, useLocation } from 'react-router'
import { useMe } from '@/features/auth'
import { useRealtimeConnection } from '@/features/notifications'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function MainLayout() {
  useMe() // làm mới thông tin user mỗi khi vào app
  useRealtimeConnection()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
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
