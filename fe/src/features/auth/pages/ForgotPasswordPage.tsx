import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button, FormField, Input, buttonVariants } from '@/components/ui'
import { getErrorMessage } from '@/lib/errors'
import { paths } from '@/routes/paths'
import { authApi } from '../api/auth.api'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth.schema'

// SG-06 · R6 · BR-ACC-09
export default function ForgotPasswordPage() {
  const send = useMutation({ mutationFn: authApi.forgotPassword })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  if (send.isSuccess)
    return (
      <div role="status">
        <MailCheck aria-hidden className="text-good mb-4 size-8" />
        <h1 className="type-title">Kiểm tra hộp thư của bạn</h1>
        <p className="type-body text-ink-2 mt-2">
          Nếu email này có tài khoản HireFlow, chúng tôi đã gửi link đặt lại mật khẩu. Link dùng
          được một lần và hết hạn sau 30 phút. Không thấy email? Hãy xem cả mục thư rác.
        </p>
        <Link to={paths.login} className={`${buttonVariants({ variant: 'secondary' })} mt-8`}>
          Về đăng nhập
        </Link>
      </div>
    )

  return (
    <>
      <h1 className="type-title">Quên mật khẩu</h1>
      <p className="type-body text-ink-muted mt-1.5 mb-8">
        Nhập email công việc. Chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.
      </p>
      <form
        onSubmit={handleSubmit(({ email }) => send.mutate(email))}
        className="space-y-4"
        noValidate
      >
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={send.isPending}>
          Gửi link đặt lại mật khẩu
        </Button>
        {send.isError && (
          <p role="alert" className="text-bad type-label">
            {getErrorMessage(send.error)}
          </p>
        )}
      </form>
      <p className="type-caption mt-8">
        Nhớ ra mật khẩu?{' '}
        <Link to={paths.login} className="text-ink underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
