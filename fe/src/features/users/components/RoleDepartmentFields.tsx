import { useFormContext, useWatch } from 'react-hook-form'
import { FormField, Select } from '@/components/ui'
import { useDepartmentOptions } from '@/features/departments'
import { Role, ROLE_LABELS } from '@/types/user'

/** Hai ô có ở mọi form dùng component này */
interface RoleDepartmentValues {
  role?: Role
  departmentId?: string
}

interface Props {
  idPrefix: string
  /** Khoá ô vai trò (Admin sửa chính mình) */
  roleLocked?: boolean
}

/**
 * Cặp ô Vai trò + Phòng ban dùng chung cho form tạo và sửa người dùng (đặt trong FormProvider).
 * BR-ACC-03: chỉ Hiring Manager chọn phòng ban; đổi sang vai trò khác thì bỏ phòng ban đã chọn.
 */
export function RoleDepartmentFields({ idPrefix, roleLocked }: Props) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<RoleDepartmentValues>()
  const role = useWatch({ control, name: 'role' })
  const departments = useDepartmentOptions()
  const needsDepartment = role === Role.HiringManager

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        label="Vai trò"
        htmlFor={`${idPrefix}-role`}
        error={errors.role?.message}
        hint={roleLocked ? 'Không tự đổi vai trò của chính mình' : undefined}
      >
        <Select
          id={`${idPrefix}-role`}
          className="w-full"
          disabled={roleLocked}
          {...register('role', {
            onChange: (e: { target: { value: string } }) => {
              if (e.target.value !== Role.HiringManager) setValue('departmentId', '')
            },
          })}
        >
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label="Phòng ban"
        htmlFor={`${idPrefix}-dept`}
        error={errors.departmentId?.message}
        hint={needsDepartment ? undefined : 'Chỉ Hiring Manager thuộc phòng ban'}
      >
        {/* Chỉ gắn vào form khi đã có danh sách: <select> không giữ được giá trị chưa có option */}
        {departments.data ? (
          <Select
            id={`${idPrefix}-dept`}
            className="w-full"
            disabled={!needsDepartment}
            {...register('departmentId')}
          >
            <option value="">{needsDepartment ? '— Chọn phòng ban —' : '— Không —'}</option>
            {departments.data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        ) : (
          <Select id={`${idPrefix}-dept`} className="w-full" disabled>
            <option>{departments.isError ? 'Không tải được phòng ban' : 'Đang tải...'}</option>
          </Select>
        )}
      </FormField>
    </div>
  )
}
