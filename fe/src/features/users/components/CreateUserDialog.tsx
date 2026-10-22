import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { Button, Dialog, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Role } from '@/types/user'
import { useCreateUser } from '../hooks/use-users'
import { createUserSchema, departmentFor, type CreateUserForm } from '../schemas/user.schema'
import { RoleDepartmentFields } from './RoleDepartmentFields'

interface Props {
  open: boolean
  onClose: () => void
}

const EMPTY: CreateUserForm = {
  fullName: '',
  email: '',
  password: '',
  role: Role.Hr,
  departmentId: '',
}

export function CreateUserDialog({ open, onClose }: Props) {
  const createUser = useCreateUser()
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY,
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form

  const close = () => {
    reset(EMPTY)
    onClose()
  }

  const onSubmit = handleSubmit(({ departmentId, ...values }) =>
    createUser.mutate(
      { ...values, departmentId: departmentFor(values.role, departmentId) },
      {
        onSuccess: close,
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  return (
    <Dialog open={open} onClose={close} title="Thêm người dùng">
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Họ tên" htmlFor="new-fullName" error={errors.fullName?.message}>
            <Input id="new-fullName" invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <FormField label="Email" htmlFor="new-email" error={errors.email?.message}>
            <Input id="new-email" type="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField
            label="Mật khẩu"
            htmlFor="new-password"
            error={errors.password?.message}
            hint="8–72 ký tự, gồm chữ hoa, chữ thường và số"
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>
          <RoleDepartmentFields idPrefix="new" />

          {errors.root && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>
              Huỷ
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Tạo
            </Button>
          </div>
        </form>
      </FormProvider>
    </Dialog>
  )
}
