import { Link, Outlet } from 'react-router'
import { paths } from '@/routes/paths'
import { BrandMark } from './BrandMark'

/** Khung cho trang công khai của ứng viên: không cần đăng nhập */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to={paths.publicJobs} className="flex items-center gap-2">
            <BrandMark />
            <span className="hidden text-sm text-slate-400 sm:inline">/ Careers</span>
          </Link>
          <Link
            to={paths.login}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            Đăng nhập nội bộ
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 bg-slate-50/60 py-6 text-center text-xs text-slate-400">
        Dữ liệu ứng viên được xử lý theo Nghị định 13/2023/NĐ-CP.
      </footer>
    </div>
  )
}
