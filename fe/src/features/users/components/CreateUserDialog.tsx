import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Dialog, FormField, Input, Select } from '@/components/ui'
import { emailSchema, passwordSchema } from '@/features/auth'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Role } from '@/types/user'
import { useCreateUser } from '../hooks/use-users'

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên ít nhất 2 ký tự').max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum([Role.User, Role.Admin]),
})
type CreateUserForm = z.infer<typeof createUserSchema>

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateUserDialog({ open, onClose }: Props) {
  const createUser = useCreateUser()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', password: '', role: Role.User },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((values) =>
    createUser.mutate(values, {
      onSuccess: close,
      onError: (error) => {
        if (!applyServerErrors(error, setError)) {
          setError('root', { message: getErrorMessage(error) })
        }
      },
    }),
  )

  return (
    <Dialog open={open} onClose={close} title="Thêm người dùng">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Họ tên" htmlFor="new-fullName" error={errors.fullName?.message}>
          <Input id="new-fullName" invalid={!!errors.fullName} {...register('fullName')} />
        </FormField>
        <FormField label="Email" htmlFor="new-email" error={errors.email?.message}>
          <Input id="new-email" type="email" invalid={!!errors.email} {...register('email')} />
        </FormField>
        <FormField label="Mật khẩu" htmlFor="new-password" error={errors.password?.message}>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        <FormField label="Vai trò" htmlFor="new-role" error={errors.role?.message}>
          <Select id="new-role" className="w-full" {...register('role')}>
            <option value={Role.User}>User</option>
            <option value={Role.Admin}>Admin</option>
          </Select>
        </FormField>

        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" loading={createUser.isPending}>
            Tạo
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
