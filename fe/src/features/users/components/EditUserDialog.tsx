import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { Button, Dialog, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { Role, type User } from '@/types/user'
import type { UpdateUserInput } from '../api/users.api'
import { useUpdateUser } from '../hooks/use-users'
import { departmentFor, editUserSchema, type EditUserForm } from '../schemas/user.schema'
import { RoleDepartmentFields } from './RoleDepartmentFields'

interface Props {
  user: User
  /** Admin đang sửa chính mình: khoá ô vai trò */
  isSelf: boolean
  onClose: () => void
}

/**
 * Sửa người dùng (API Contract 4.2, FE-06): họ tên, vai trò, phòng ban, đặt lại mật khẩu.
 * Email là định danh, không sửa. Khoá/mở tài khoản đi qua nút riêng (/users/:id/status).
 * Trang cha mount lại dialog theo key={user.id} nên defaultValues luôn là của user đang chọn.
 */
export function EditUserDialog({ user, isSelf, onClose }: Props) {
  const updateUser = useUpdateUser()
  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: user.fullName,
      role: user.role,
      // BR-ACC-03: chỉ Hiring Manager có phòng ban (dữ liệu cũ của HR bị bỏ qua)
      departmentId: user.role === Role.HiringManager ? (user.department?.id ?? '') : '',
      password: '',
    },
  })
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = form

  const onSubmit = handleSubmit(({ fullName, role: picked, departmentId, password }) => {
    const role = isSelf || !picked ? user.role : picked
    const input: UpdateUserInput = {
      fullName,
      role,
      departmentId: departmentFor(role, departmentId),
      ...(password && { password }),
    }
    updateUser.mutate(
      { id: user.id, input },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    )
  })

  return (
    <Dialog open onClose={onClose} title="Sửa người dùng">
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            label="Email"
            htmlFor="edit-email"
            hint="Email là tên đăng nhập, không đổi được"
          >
            <Input id="edit-email" type="email" value={user.email} disabled readOnly />
          </FormField>
          <FormField label="Họ tên" htmlFor="edit-fullName" error={errors.fullName?.message}>
            <Input id="edit-fullName" invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <RoleDepartmentFields idPrefix="edit" roleLocked={isSelf} />
          <FormField
            label="Đặt lại mật khẩu"
            htmlFor="edit-password"
            error={errors.password?.message}
            hint="Để trống nếu giữ mật khẩu cũ"
          >
            <Input
              id="edit-password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          {/* BR-ACC-06: quyền mới nằm trong access token kế tiếp */}
          <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <Info className="mt-px size-3.5 shrink-0 text-slate-400" />
            Đổi vai trò hoặc phòng ban có hiệu lực trong tối đa 15 phút, khi phiên của người dùng
            được làm mới.
          </p>

          {errors.root && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={!isDirty} loading={updateUser.isPending}>
              Lưu
            </Button>
          </div>
        </form>
      </FormProvider>
    </Dialog>
  )
}
