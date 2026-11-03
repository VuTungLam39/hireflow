import { Outlet } from 'react-router'
import { BrandMark } from './BrandMark'

function SampleCv() {
  const line = 'bg-line h-2 rounded-full'
  return (
    <figure aria-hidden className="relative w-full max-w-[380px] select-none">
      <div className="bg-surface text-ink-2 relative rounded-sm px-8 pt-7 pb-8 text-[13px] leading-6">
        <p className="text-ink font-serif text-lg font-semibold tracking-[0.02em]">
          NGUYỄN MINH ANH
        </p>
        <p className="text-ink-muted text-xs">Backend Developer · Hà Nội</p>
        <div className="border-line-soft my-4 border-t" />
        <p className="type-overline mb-2">Kinh nghiệm</p>
        <p className="relative">
          <span className="border-ink-2 text-ink absolute top-1 -left-6 flex size-[18px] items-center justify-center rounded-full border text-xs font-semibold">
            1
          </span>
          <span className="mark-evidence">3 năm phát triển API bằng NestJS</span> cho hệ thống thanh
          toán nội địa.
        </p>
        <div className="mt-2 space-y-2">
          <div className={`${line} w-11/12`} />
          <div className={`${line} w-3/4`} />
        </div>
        <p className="relative mt-3">
          <span className="border-ink-2 text-ink absolute top-1 -left-6 flex size-[18px] items-center justify-center rounded-full border text-xs font-semibold">
            2
          </span>
          Thiết kế <span className="mark-evidence">lược đồ PostgreSQL</span> cho 2 triệu giao dịch
          mỗi ngày.
        </p>
        <div className="mt-3 space-y-2">
          <div className={`${line} w-5/6`} />
          <div className={`${line} w-2/3`} />
        </div>
      </div>
      <figcaption className="bg-canvas border-line text-ink-2 absolute -right-4 -bottom-5 rounded-sm border px-3.5 py-2.5 sm:-right-10">
        <span className="text-ink-muted block text-xs">Mức phù hợp</span>
        <span className="type-figure text-2xl leading-7">78</span>
        <span className="type-caption">/100 · 5 tiêu chí</span>
      </figcaption>
    </figure>
  )
}

export function AuthLayout() {
  return (
    <div className="bg-canvas grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="bg-rail text-rail-text relative hidden flex-col px-12 py-10 lg:flex xl:px-16">
        <BrandMark onDark tagline />
        <div className="my-auto max-w-[520px] space-y-10 py-12">
          <div className="space-y-4">
            <h1 className="type-display text-white">Mỗi quyết định tuyển dụng đều có căn cứ.</h1>
            <p className="text-rail-text max-w-md text-[15px] leading-[26px]">
              HireFlow đánh dấu đúng dòng trong CV chứng minh ứng viên khớp từng tiêu chí của tin,
              để bạn duyệt nhanh mà vẫn là người quyết định.
            </p>
          </div>
          <SampleCv />
        </div>
        <p className="text-rail-muted text-xs">© 2026 HireFlow · Dự án thực tập NCC</p>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[360px]">
          <BrandMark size="lg" tagline className="mb-10 lg:hidden" />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
