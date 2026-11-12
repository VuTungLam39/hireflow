import { Link, NavLink, Outlet } from 'react-router'
import { usePublicCompany } from '@/features/company'
import { useFocusMainOnNavigate } from '@/hooks/use-focus-main'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { BrandMark } from './BrandMark'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-sm px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
  )

export function PublicLayout() {
  const { data: company } = usePublicCompany()
  useFocusMainOnNavigate()
  return (
    <div className="bg-surface text-ink-2 flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-ink sr-only z-[70] rounded-sm px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Bỏ qua tới nội dung
      </a>
      <header className="border-line bg-surface sticky top-0 z-20 border-b">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link to={paths.publicJobs} aria-label="HireFlow – Việc làm" className="rounded-sm">
              <BrandMark compact className="sm:hidden" />
              <BrandMark className="hidden sm:inline-flex" />
            </Link>
            <span aria-hidden className="bg-line h-5 w-px" />
            <nav aria-label="Trang tuyển dụng" className="-ml-2 flex items-center">
              <NavLink to={paths.publicJobs} className={navClass}>
                Việc làm
              </NavLink>
              {company && (
                <NavLink to={paths.careers} className={navClass}>
                  Về công ty
                </NavLink>
              )}
            </nav>
          </div>
          <Link
            to={paths.login}
            className="text-ink-muted hover:text-ink shrink-0 rounded-sm px-2 py-1.5 text-[13px] whitespace-nowrap transition-colors"
          >
            <span className="sm:hidden">Đăng nhập</span>
            <span className="hidden sm:inline">Đăng nhập nội bộ</span>
          </Link>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-10 pb-16 outline-none sm:pt-14"
      >
        <Outlet />
      </main>
      <footer className="border-line type-caption border-t">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-2 px-4 py-6">
          <span>© 2026 HireFlow</span>
          <span>Dữ liệu ứng viên được xử lý theo Nghị định 13/2023/NĐ-CP.</span>
        </div>
      </footer>
    </div>
  )
}
