import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Dialog, FormField, Input } from '@/components/ui'
import { applyServerErrors, getErrorMessage } from '@/lib/errors'
import { useSaveDepartment } from '../hooks/use-departments'
import type { Department } from '../types'

const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Tên ít nhất 2 ký tự').max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_]{2,20}$/, 'Mã gồm 2–20 ký tự chữ in hoa, số hoặc _'),
})
type DepartmentForm = z.infer<typeof departmentSchema>

interface Props {
  open: boolean
  onClose: () => void
  /** Có = sửa, không có = tạo mới */
  department?: Department | null
}

export function DepartmentFormDialog({ open, onClose, department }: Props) {
  const save = useSaveDepartment()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    values: { name: department?.name ?? '', code: department?.code ?? '' },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((input) =>
    save.mutate(
      { id: department?.id, input },
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
    <Dialog open={open} onClose={close} title={department ? 'Sửa phòng ban' : 'Thêm phòng ban'}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Tên phòng ban" htmlFor="dept-name" error={errors.name?.message}>
          <Input id="dept-name" invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField label="Mã" htmlFor="dept-code" error={errors.code?.message}>
          <Input id="dept-code" invalid={!!errors.code} {...register('code')} />
        </FormField>
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Huỷ
          </Button>
          <Button type="submit" loading={save.isPending}>
            Lưu
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
