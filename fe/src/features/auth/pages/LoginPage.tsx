import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { paths } from '@/routes/paths'
import { useLogin } from '../hooks/use-auth'
import { loginSchema, type LoginInput } from '../schemas/auth.schema'

export default function LoginPage() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
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
      <h1 className="mb-1 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mb-6 text-sm text-slate-500">Chào mừng bạn quay lại</p>

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
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to={paths.register} className="text-primary font-medium hover:underline">
          Đăng ký
        </Link>
      </p>
    </>
  )
}
