import { Role } from '@/types/user'
import { Permission, ROLE_PERMISSIONS } from './permissions'

interface BackendPermissions {
  ROLE_PERMISSIONS: Record<string, readonly string[]>
}
interface BackendPermissionEnum {
  Permission: Record<string, string>
}
interface BackendRoleEnum {
  Role: Record<string, string>
}

const only = <T>(modules: Record<string, unknown>) => {
  const values = Object.values(modules)
  if (values.length !== 1) throw new Error('Không tìm thấy file quyền của backend')
  return values[0] as T
}

const backend = only<BackendPermissions>(
  import.meta.glob('../../../be/src/common/permissions/role-permissions.ts', { eager: true }),
)
const backendPermission = only<BackendPermissionEnum>(
  import.meta.glob('../../../be/src/common/permissions/permission.enum.ts', { eager: true }),
)
const backendRole = only<BackendRoleEnum>(
  import.meta.glob('../../../be/src/common/enums/role.enum.ts', { eager: true }),
)

const sorted = (values: Iterable<string>) => [...values].sort()

// Kickoff 11.1, Frontend Architecture 8.3
describe('bảng quyền FE khớp BE', () => {
  it('cùng tập role', () => {
    expect(sorted(Object.values(Role))).toEqual(sorted(Object.values(backendRole.Role)))
  })

  it('cùng tập permission', () => {
    expect(sorted(Object.values(Permission))).toEqual(
      sorted(Object.values(backendPermission.Permission)),
    )
  })

  it.each(Object.values(Role))('role %s có đúng các permission như BE', (role) => {
    expect(sorted(ROLE_PERMISSIONS[role])).toEqual(sorted(backend.ROLE_PERMISSIONS[role] ?? []))
  })
})
