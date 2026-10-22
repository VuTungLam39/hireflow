import { Quote, ScanSearch, Scale, ShieldCheck } from 'lucide-react'
import { Outlet } from 'react-router'
import { BrandMark } from './BrandMark'

const highlights = [
  { icon: Quote, text: 'Mỗi điểm số kèm trích dẫn nguyên văn từ CV' },
  { icon: Scale, text: 'Chỉnh trọng số, xếp hạng đổi ngay lập tức' },
  { icon: ShieldCheck, text: 'Đúng người, đúng quyền, đúng phòng ban' },
]

/** Trang đăng nhập: khối thương hiệu bên trái (từ màn lg), form bên phải */
export function AuthLayout() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="bg-dots absolute inset-0" />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 size-96 rounded-full bg-indigo-400/20 blur-3xl"
        />

        <BrandMark light className="relative" />

        <div className="relative my-auto max-w-md space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <ScanSearch className="size-3.5" />
              AI Screening có bằng chứng
            </span>
            <h1 className="text-3xl leading-tight font-semibold">
              Sàng lọc CV nhanh hơn,
              <br />
              và luôn giải thích được vì sao.
            </h1>
          </div>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                style={{ animationDelay: `${150 + i * 80}ms` }}
                className="animate-slide-up flex items-center gap-3 text-indigo-50"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200">© 2026 HireFlow · Dự án thực tập NCC</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="animate-slide-up w-full max-w-sm">
          <BrandMark className="mb-8 lg:hidden" />
          <Outlet />
        </div>
      </section>
    </main>
  )
}
