import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { Button, FormField, Input } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { SITE_NAME } from '@/prerender/shared'
import { paths } from '@/routes/paths'
import { employersApi } from '../api/employers.api'

const RESEND_WAIT_S = 60

// MVP 3 · US-19, BR-ACC-09: gửi lại tối đa 3 lần/giờ, BE luôn trả 202
export default function CheckEmailPage() {
  useDocumentTitle(`Kiểm tra email – ${SITE_NAME}`)
  const sentTo = (useLocation().state as { email?: string } | null)?.email ?? ''
  const [email, setEmail] = useState(sentTo)
  const [wait, setWait] = useState(sentTo ? RESEND_WAIT_S : 0)
  const resend = useMutation({ mutationFn: employersApi.resendVerification })

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const onResend = () =>
    resend.mutate(email.trim().toLowerCase(), {
      onSuccess: () => {
        toast.success('Nếu email này đang chờ xác minh, một link mới đã được gửi')
        setWait(RESEND_WAIT_S)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })

  return (
    <div className="mx-auto max-w-[480px]">
      <MailCheck aria-hidden className="text-brand mb-4 size-8" />
      <h1 className="type-title">Kiểm tra email</h1>
      <p className="type-body text-ink-2 mt-2">
        {sentTo ? (
          <>
            Chúng tôi đã gửi link xác minh tới <strong className="text-ink">{sentTo}</strong>.
          </>
        ) : (
          'Chúng tôi đã gửi link xác minh tới email bạn dùng để đăng ký.'
        )}{' '}
        Mở link trong 24 giờ để kích hoạt tài khoản Admin công ty.
      </p>

      <div className="border-line mt-8 space-y-4 border-t pt-6">
        <p className="type-label">Không thấy email? Xem cả thư mục Spam, hoặc gửi lại.</p>
        <FormField label="Email" htmlFor="resend-email">
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <Button
          variant="secondary"
          disabled={wait > 0 || !email.includes('@')}
          loading={resend.isPending}
          onClick={onResend}
        >
          {wait > 0 ? `Gửi lại sau ${wait} giây` : 'Gửi lại email xác minh'}
        </Button>
      </div>

      <p className="type-caption mt-8">
        Đã xác minh?{' '}
        <Link to={paths.login} className="text-ink underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
