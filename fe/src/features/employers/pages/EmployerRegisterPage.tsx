import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Button, Checkbox, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { paths } from '@/routes/paths'
import { employersApi } from '../api/employers.api'
import { registerEmployerSchema, type RegisterEmployerForm } from '../schemas/register.schema'

// MVP 3 · US-19, F-ORG-02
export default function EmployerRegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterEmployerForm>({
    resolver: zodResolver(registerEmployerSchema),
    defaultValues: {
      companyName: '',
      taxCode: '',
      website: '',
      fullName: '',
      email: '',
      password: '',
      acceptTerms: false,
    },
  })
  const submit = useMutation({ mutationFn: employersApi.register })

  const onSubmit = ({ website, ...values }: RegisterEmployerForm) =>
    submit.mutate(
      { ...values, acceptTerms: true, ...(website ? { website } : {}) },
      {
        onSuccess: () =>
          navigate(paths.employerCheckEmail, { state: { email: values.email }, replace: true }),
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    )

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="type-title">Đăng ký nhà tuyển dụng</h1>
      <p className="type-body text-ink-muted mt-1.5 mb-8">
        Tạo tài khoản cho công ty của bạn trên HireFlow. Sau khi xác minh email, bạn đăng nhập và
        chuẩn bị tin tuyển dụng được ngay. Tin chỉ hiện công khai khi Quản trị sàn duyệt công ty.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <fieldset className="space-y-4">
          <legend className="type-heading mb-1">Công ty</legend>
          <FormField label="Tên công ty" htmlFor="companyName" error={errors.companyName?.message}>
            <Input
              id="companyName"
              autoComplete="organization"
              invalid={!!errors.companyName}
              {...register('companyName')}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Mã số thuế"
              htmlFor="taxCode"
              hint="10 hoặc 13 chữ số"
              error={errors.taxCode?.message}
            >
              <Input
                id="taxCode"
                inputMode="numeric"
                invalid={!!errors.taxCode}
                {...register('taxCode')}
              />
            </FormField>
            <FormField label="Website" htmlFor="website" optional error={errors.website?.message}>
              <Input
                id="website"
                type="url"
                placeholder="https://"
                autoComplete="url"
                invalid={!!errors.website}
                {...register('website')}
              />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="type-heading mb-1">Tài khoản Admin công ty</legend>
          <FormField label="Họ tên" htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              invalid={!!errors.fullName}
              {...register('fullName')}
            />
          </FormField>
          <FormField label="Email công việc" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>
          <FormField
            label="Mật khẩu"
            htmlFor="password"
            hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>
        </fieldset>

        <div>
          <Checkbox
            label={
              <>
                Tôi đồng ý điều khoản sử dụng sàn và{' '}
                <Link to={paths.privacy} target="_blank" className="text-ink underline">
                  chính sách dữ liệu
                </Link>
                . Đây là bản demo, không dùng cho tuyển dụng thật.
              </>
            }
            aria-invalid={!!errors.acceptTerms}
            {...register('acceptTerms')}
          />
          {errors.acceptTerms && (
            <p className="text-bad type-label mt-1.5">{errors.acceptTerms.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full sm:w-auto" loading={submit.isPending}>
            Đăng ký
          </Button>
          {errors.root && (
            <p role="alert" className="text-bad type-label">
              {errors.root.message}
            </p>
          )}
          <p className="type-caption">
            Đã có tài khoản?{' '}
            <Link to={paths.login} className="text-ink underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
