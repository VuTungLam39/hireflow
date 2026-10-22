import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button, Dialog, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorCode, getErrorMessage } from '@/lib/errors'
import { useChangePassword } from '../hooks/use-auth'
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas/auth.schema'

interface Props {
  open: boolean
  onClose: () => void
}

const EMPTY: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

/**
 * Đổi mật khẩu của chính mình (API Contract 4.1, BR-ACC-06).
 * Thành công: phiên hiện tại giữ nguyên, BE đăng xuất mọi phiên khác.
 */
export function ChangePasswordDialog({ open, onClose }: Props) {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  })

  const close = () => {
    reset(EMPTY)
    changePassword.reset()
    onClose()
  }

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) =>
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: close,
        onError: (error) => {
          if (getErrorCode(error) === 'WRONG_PASSWORD') {
            setError('currentPassword', { message: getErrorMessage(error) }, { shouldFocus: true })
          } else if (!applyServerErrors(error, setError)) {
            setError('root', { message: getErrorMessage(error) })
          }
        },
      },
    ),
  )

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Đổi mật khẩu"
      description="Sau khi đổi, các thiết bị khác đang đăng nhập sẽ bị đăng xuất."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          label="Mật khẩu hiện tại"
          htmlFor="pw-current"
          error={errors.currentPassword?.message}
        >
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>
        <FormField
          label="Mật khẩu mới"
          htmlFor="pw-new"
          error={errors.newPassword?.message}
          hint="8–72 ký tự, gồm chữ hoa, chữ thường và số"
        >
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            aria-describedby="pw-new-hint"
            invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
        </FormField>
        <FormField
          label="Nhập lại mật khẩu mới"
          htmlFor="pw-confirm"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        {errors.root && (
          <p role="alert" className="text-sm text-red-600">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" loading={changePassword.isPending}>
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
