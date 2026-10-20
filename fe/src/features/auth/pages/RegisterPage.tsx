import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { paths } from '@/routes/paths'
import { useRegister } from '../hooks/use-auth'
import {
  registerSchema,
  type RegisterFormOutput,
  type RegisterFormValues,
} from '../schemas/auth.schema'

export default function RegisterPage() {
  const registerMutation = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  // confirmPassword chỉ dùng để kiểm tra ở client, không gửi lên API
  const onSubmit = handleSubmit(({ fullName, email, password }) =>
    registerMutation.mutate(
      { fullName, email, password },
      {
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Tạo tài khoản</h1>
      <p className="mb-6 text-sm text-slate-500">Điền thông tin để bắt đầu</p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Họ tên" htmlFor="fullName" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            invalid={!!errors.fullName}
            {...register('fullName')}
          />
        </FormField>

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
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField
          label="Xác nhận mật khẩu"
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

        {errors.root && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" loading={registerMutation.isPending}>
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link to={paths.login} className="text-primary font-medium hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
