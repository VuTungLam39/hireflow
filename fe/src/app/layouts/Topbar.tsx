import { ChevronRight, Menu, Plus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { buttonVariants } from '@/components/ui'
import { NotificationBell } from '@/features/notifications'
import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useUiStore } from '@/stores/ui.store'
import { BrandMark } from './BrandMark'
import { findNavItem } from './nav-config'
import { UserMenu } from './UserMenu'

// Thanh nav trên (FE Architecture 10): breadcrumb, tìm hồ sơ nhanh, hành động chính, thông báo, tài khoản
export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const canSearch = usePermission(Permission.ApplicationRead)
  const canCreateJob = usePermission(Permission.JobCreate)
  const [query, setQuery] = useState('')
  const current = findNavItem(pathname)
  const isDetail = !!current && pathname !== current.item.to

  const search = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    void navigate(`${paths.applications}?search=${encodeURIComponent(q)}`)
    setQuery('')
  }

  return (
    <header className="bg-topbar shadow-topbar sticky top-0 z-20 backdrop-blur-md">
      <div aria-hidden className="bg-brand-line h-0.5" />
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <button
          type="button"
          aria-label="Mở menu"
          className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
        </button>
        <span className="md:hidden">
          <BrandMark />
        </span>

        {current && (
          <nav
            aria-label="Vị trí hiện tại"
            className="hidden min-w-0 items-center gap-1.5 text-sm md:flex"
          >
            <span className="text-slate-400">{current.group}</span>
            <ChevronRight className="size-4 shrink-0 text-slate-300" />
            {isDetail ? (
              <>
                <Link to={current.item.to} className="truncate text-slate-500 hover:text-slate-900">
                  {current.item.label}
                </Link>
                <ChevronRight className="size-4 shrink-0 text-slate-300" />
                <span aria-current="page" className="font-semibold text-slate-900">
                  Chi tiết
                </span>
              </>
            ) : (
              <span
                aria-current="page"
                className="flex items-center gap-2 font-semibold text-slate-900"
              >
                <current.item.icon className="text-primary size-4" />
                {current.item.label}
              </span>
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {canSearch && (
            <form role="search" onSubmit={search} className="relative hidden lg:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Tìm hồ sơ theo tên hoặc email ứng viên"
                placeholder="Tìm hồ sơ theo tên, email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="focus:border-primary focus:ring-primary/20 h-10 w-64 rounded-full border border-slate-200 bg-slate-50 pr-4 pl-9 text-sm transition-[width,background-color] duration-200 placeholder:text-slate-400 focus:w-80 focus:bg-white focus:ring-2 focus:outline-none xl:w-72"
              />
            </form>
          )}
          {canCreateJob && (
            <Link
              to={paths.jobNew}
              className={cn(buttonVariants({ size: 'sm' }), 'shadow-glow hidden sm:inline-flex')}
            >
              <Plus />
              Tạo job
            </Link>
          )}
          <NotificationBell align="right" />
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
