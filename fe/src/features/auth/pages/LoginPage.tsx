import { Eye, EyeOff, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, FormField, Input } from '@/components/ui'
import { env } from '@/config/env'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useLogin } from '../hooks/use-auth'
import { loginSchema, type LoginInput } from '../schemas/auth.schema'

// be/src/database/seeds/demo/org.ts
const DEMO_PASSWORD = 'Admin@123'
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com' },
  { label: 'HR', email: 'hr@hireflow.dev' },
  { label: 'HM Phát triển phần mềm', email: 'hm.eng@hireflow.dev' },
  { label: 'HM Kinh doanh', email: 'hm.sales@hireflow.dev' },
  { label: 'HM Mobile', email: 'phuoc.le@hireflow.dev' },
]

export default function LoginPage() {
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
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
        if (!applyServerErrors(error, setError)) {
          setError('root', { message: getErrorMessage(error) })
        }
      },
    })

  return (
    <>
      <h1 className="type-title">Đăng nhập</h1>
      <p className="type-body text-ink-muted mt-1.5 mb-8">Dùng email công việc và mật khẩu của bạn.</p>

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

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
        {errors.root && (
          <p role="alert" className="text-bad type-label">
            {errors.root.message}
          </p>
        )}
      </form>

      {env.isDev && (
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

      <p className="type-caption mt-8">Chưa có tài khoản? Liên hệ quản trị viên.</p>
    </>
  )
}
