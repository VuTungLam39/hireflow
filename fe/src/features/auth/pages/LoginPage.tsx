import { Eye, EyeOff, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { Button, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorCode, getErrorMessage } from '@/lib/errors'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { paths } from '@/routes/paths'
import { useLogin } from '../hooks/use-auth'
import { loginSchema, type LoginInput } from '../schemas/auth.schema'

// be/src/database/seeds/demo/org.ts · SG-04 · R4
const DEMO_PASSWORD = 'Admin@123'
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com' },
  { label: 'HR', email: 'hr@hireflow.dev' },
  { label: 'HM Phát triển phần mềm', email: 'hm.eng@hireflow.dev' },
  { label: 'HM Kinh doanh', email: 'hm.sales@hireflow.dev' },
  { label: 'HM Mobile', email: 'phuoc.le@hireflow.dev' },
  { label: 'Interviewer', email: 'interviewer@hireflow.dev' },
]

export default function LoginPage() {
  useDocumentTitle('Đăng nhập – HireFlow')
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [unverified, setUnverified] = useState<string | null>(null)
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (values: LoginInput) =>
    login.mutate(values, {
      onError: (error) => {
        // BR-ACC-09
        setUnverified(getErrorCode(error) === 'EMAIL_NOT_VERIFIED' ? values.email : null)
        if (!applyServerErrors(error, setError)) {
          setError('root', { message: getErrorMessage(error) })
        }
      },
    })

  return (
    <>
      <h1 className="type-title">Đăng nhập</h1>
      <p className="type-body text-ink-muted mt-1.5 mb-8">
        Dùng email công việc và mật khẩu của bạn.
      </p>
      {notice && (
        <p role="status" className="bg-good-soft text-ink-2 mb-6 rounded-sm px-4 py-3">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              invalid={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-muted hover:text-ink absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-sm"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>

        {/* SG-06 · R6 */}
        <p className="-mt-1 text-right">
          <Link to={paths.forgotPassword} className="text-ink type-caption underline">
            Quên mật khẩu?
          </Link>
        </p>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
        {errors.root && (
          <p role="alert" className="text-bad type-label">
            {errors.root.message}
            {unverified && (
              <>
                {' '}
                <Link
                  to={paths.employerCheckEmail}
                  state={{ email: unverified }}
                  className="text-ink underline"
                >
                  Gửi lại email xác minh
                </Link>
              </>
            )}
          </p>
        )}
      </form>

      {import.meta.env.DEV && (
        <div className="border-line mt-8 rounded-md border border-dashed p-4">
          <p className="type-label mb-3 flex items-center gap-2">
            <FlaskConical className="text-brand size-4" />
            Tài khoản seed · đăng nhập nhanh với vai trò
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <Button
                key={acc.email}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setValue('email', acc.email)
                  setValue('password', DEMO_PASSWORD)
                }}
              >
                {acc.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="type-caption mt-8">
        Nhân viên công ty: tài khoản do Admin công ty tạo. Công ty mới?{' '}
        <Link to={paths.employerRegister} className="text-ink underline">
          Đăng ký nhà tuyển dụng
        </Link>
      </p>
    </>
  )
}
