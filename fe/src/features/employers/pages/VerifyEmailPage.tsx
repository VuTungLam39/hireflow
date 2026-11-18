import { useMutation } from '@tanstack/react-query'
import { CircleCheck, CircleX } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { buttonVariants, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { employersApi } from '../api/employers.api'

// MVP 3 · US-19, BR-ACC-09: link dùng một lần
export default function VerifyEmailPage() {
  const token = useSearchParams()[0].get('t') ?? ''
  const verify = useMutation({ mutationFn: employersApi.verifyEmail })
  const sent = useRef(false)

  useEffect(() => {
    // StrictMode gọi effect hai lần; lần hai sẽ gặp token đã dùng
    if (sent.current || !token) return
    sent.current = true
    verify.mutate(token)
  }, [token, verify])

  if (token && (verify.isIdle || verify.isPending))
    return (
      <div role="status" className="text-ink-2 flex items-center justify-center gap-3 py-16">
        <Spinner />
        Đang xác minh email…
      </div>
    )

  if (verify.isSuccess)
    return (
      <div className="mx-auto max-w-[480px]">
        <CircleCheck aria-hidden className="text-good mb-4 size-8" />
        <h1 className="type-title">Email đã được xác minh</h1>
        <p className="type-body text-ink-2 mt-2">
          Bạn đã đăng nhập được với vai Admin công ty để thêm phòng ban, người dùng và chuẩn bị tin
          tuyển dụng. Tin chỉ hiện công khai sau khi Quản trị sàn duyệt công ty; bạn sẽ nhận email
          khi có kết quả.
        </p>
        <Link to={paths.login} className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
          Đăng nhập
        </Link>
      </div>
    )

  // Không nói rõ lý do (sai, hết hạn hay đã dùng)
  return (
    <div className="mx-auto max-w-[480px]">
      <CircleX aria-hidden className="text-bad mb-4 size-8" />
      <h1 className="type-title">Link không còn hiệu lực</h1>
      <p className="type-body text-ink-2 mt-2">
        Link xác minh chỉ dùng được một lần và hết hạn sau 24 giờ. Nếu bạn đã xác minh trước đó, hãy
        đăng nhập. Nếu chưa, hãy gửi lại email xác minh.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to={paths.employerCheckEmail} className={buttonVariants({ variant: 'primary' })}>
          Gửi lại email xác minh
        </Link>
        <Link to={paths.login} className={buttonVariants({ variant: 'secondary' })}>
          Đăng nhập
        </Link>
      </div>
    </div>
  )
}
