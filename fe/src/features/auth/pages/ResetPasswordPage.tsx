import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CircleX } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Button, FormField, Input, buttonVariants } from '@/components/ui'
import { applyServerErrors, getErrorCode, getErrorMessage } from '@/lib/errors'
import { paths } from '@/routes/paths'
import { authApi } from '../api/auth.api'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schema'

const RESET_DONE_NOTICE = 'Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.'

const tokenFromHash = () => new URLSearchParams(window.location.hash.slice(1)).get('t') ?? ''

// SG-06 · R6
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [token] = useState(tokenFromHash)
  const reset = useMutation({ mutationFn: authApi.resetPassword })
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // R5
  useLayoutEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
  }, [])

  if (!token || getErrorCode(reset.error) === 'TOKEN_INVALID')
    return (
      <div>
        <CircleX aria-hidden className="text-bad mb-4 size-8" />
        <h1 className="type-title">Link không còn hiệu lực</h1>
        <p className="type-body text-ink-2 mt-2">
          Link đặt lại mật khẩu chỉ dùng được một lần, hết hạn sau 30 phút và mất hiệu lực khi bạn
          xin link mới. Hãy gửi lại yêu cầu để nhận link mới.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link to={paths.forgotPassword} className={buttonVariants({ variant: 'primary' })}>
            Gửi lại link
          </Link>
          <Link to={paths.login} className={buttonVariants({ variant: 'secondary' })}>
            Đăng nhập
          </Link>
        </div>
      </div>
    )

  const onSubmit = ({ password }: ResetPasswordFormValues) =>
    reset.mutate(
      { token, password },
      {
        onSuccess: () =>
          void navigate(paths.login, { replace: true, state: { notice: RESET_DONE_NOTICE } }),
        onError: (error) => {
          if (getErrorCode(error) === 'TOKEN_INVALID') return
          if (!applyServerErrors(error, setError))
            setError('root', { message: getErrorMessage(error) })
        },
      },
    )

  return (
    <>
      <h1 className="type-title">Đặt mật khẩu mới</h1>
      <p className="type-body text-ink-muted mt-1.5 mb-8">
        Sau khi đặt lại, mọi phiên đăng nhập cũ của tài khoản sẽ bị đăng xuất.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label="Mật khẩu mới"
          htmlFor="password"
          error={errors.password?.message}
          hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số"
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Nhập lại mật khẩu mới"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>
          Đặt mật khẩu mới
        </Button>
        {errors.root && (
          <p role="alert" className="text-bad type-label">
            {errors.root.message}
          </p>
        )}
      </form>
    </>
  )
}
