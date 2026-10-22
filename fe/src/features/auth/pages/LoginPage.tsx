import { FlaskConical } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, FormField, Input } from '@/components/ui'
import { env } from '@/config/env'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useLogin } from '../hooks/use-auth'
import { loginSchema, type LoginInput } from '../schemas/auth.schema'

// all: src/mocks/data.ts · dev + BE thật: be/src/database/seeds/seed.ts
const MOCK_DEMO = { password: 'Hireflow@123', admin: 'admin@hireflow.dev' }
const SEED_DEMO = { password: 'Admin@123', admin: 'admin@example.com' }
const demo = env.apiMocks === 'all' ? MOCK_DEMO : env.isDev ? SEED_DEMO : null
const DEMO_PASSWORD = demo?.password ?? ''
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: demo?.admin ?? '' },
  { label: 'HR', email: 'hr@hireflow.dev' },
  { label: 'HM Kỹ thuật', email: 'hm.eng@hireflow.dev' },
  { label: 'HM Kinh doanh', email: 'hm.sales@hireflow.dev' },
]

export default function LoginPage() {
  const login = useLogin()
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
      <h1 className="text-2xl font-semibold tracking-tight">Chào mừng trở lại</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Đăng nhập bằng tài khoản nội bộ do Admin cấp.
      </p>

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
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        {errors.root && (
          <p
            role="alert"
            className="animate-scale-in rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-600/10"
          >
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
      </form>

      {demo && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4 text-sm">
          <p className="mb-3 flex items-center gap-2 font-medium text-slate-600">
            <FlaskConical className="text-primary size-4" />
            {env.apiMocks === 'all' ? 'Dữ liệu giả' : 'Tài khoản seed'} · đăng nhập nhanh với vai
            trò
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

      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản? Liên hệ Admin để được cấp.
      </p>
    </>
  )
}
