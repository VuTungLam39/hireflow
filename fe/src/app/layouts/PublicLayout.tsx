import { Link, Outlet } from 'react-router'
import { paths } from '@/routes/paths'
import { BrandMark } from './BrandMark'

export function PublicLayout() {
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
          <Link to={paths.publicJobs} className="flex items-center gap-3 rounded-sm">
            <BrandMark />
            <span aria-hidden className="bg-line hidden h-5 w-px sm:block" />
            <span className="text-ink-2 hidden text-sm font-medium sm:inline">Việc làm</span>
          </Link>
          <Link
            to={paths.login}
            className="text-ink-muted hover:text-ink rounded-sm px-2 py-1.5 text-[13px] transition-colors"
          >
            Đăng nhập nội bộ
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-10 pb-16 sm:pt-14">
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
