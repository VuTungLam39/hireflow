import { delay, http } from 'msw'
import { Permission } from '@/lib/permissions'
import { Role } from '@/types/user'
import { db, uid, type UserRow } from '../data'
import {
  api,
  authorize,
  fail,
  includesText,
  isStrongPassword,
  notFound,
  ok,
  paginate,
  searchParams,
  toUser,
} from '../http'

interface UserBody {
  email?: string
  password?: string
  fullName?: string
  role?: Role
  departmentId?: string | null
  isActive?: boolean
}

type FieldError = { field: string; messages: string[] }

/**
 * Kiểm phần chung của tạo/sửa user. BR-ACC-03: Hiring Manager bắt buộc có phòng ban (400);
 * Admin và HR không gắn phòng ban. BR-ACC-06: mật khẩu đủ mạnh.
 */
function checkUser(role: Role, departmentId: string | null | undefined, password?: string) {
  const errors: FieldError[] = []
  if (role === Role.HiringManager) {
    if (!departmentId) {
      errors.push({ field: 'departmentId', messages: ['Hiring Manager phải thuộc một phòng ban'] })
    } else if (!db.departments.some((d) => d.id === departmentId)) {
      errors.push({ field: 'departmentId', messages: ['Phòng ban không tồn tại'] })
    }
  }
  if (password !== undefined && !isStrongPassword(password)) {
    errors.push({
      field: 'password',
      messages: ['Mật khẩu 8–72 ký tự, gồm chữ hoa, chữ thường và số'],
    })
  }
  return errors
}

const validationFailed = (errors: FieldError[]) =>
  fail(400, 'VALIDATION_FAILED', 'Validation failed', errors)

const departmentDto = (d: (typeof db.departments)[number]) => ({
  ...d,
  userCount: db.users.filter((u) => u.departmentId === d.id).length,
  jobCount: db.jobs.filter((j) => j.departmentId === d.id).length,
})

export const adminHandlers = [
  // ----- users -----
  http.get(api('/users'), async ({ request }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const params = searchParams(request)
    const role = params.get('role')
    const search = params.get('search')
    const rows = db.users
      .filter((u) => (!role || u.role === role) && includesText(`${u.email} ${u.fullName}`, search))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const { items, meta } = paginate(rows, params)
    return ok(items.map(toUser), { meta })
  }),

  http.post(api('/users'), async ({ request }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const body = (await request.json()) as Required<UserBody>
    const errors = checkUser(body.role, body.departmentId, body.password)
    if (errors.length) return validationFailed(errors)
    if (db.users.some((u) => u.email === body.email)) {
      return fail(409, 'EMAIL_EXISTS', 'Email already exists', [
        { field: 'email', messages: ['Email đã tồn tại'] },
      ])
    }
    const now = new Date().toISOString()
    const row: UserRow = {
      id: uid('u'),
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role,
      departmentId: body.role === Role.HiringManager ? body.departmentId : null,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    }
    db.users.push(row)
    return ok(toUser(row), { status: 201, message: 'User created' })
  }),

  http.get(api('/users/:id'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const row = db.users.find((u) => u.id === params.id)
    return row ? ok(toUser(row)) : notFound('User')
  }),

  http.patch(api('/users/:id'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const row = db.users.find((u) => u.id === params.id)
    if (!row) return notFound('User')
    // Email không sửa; isActive chỉ đổi qua /users/:id/status
    const { email: _email, isActive: _isActive, ...patch } = (await request.json()) as UserBody
    const role = patch.role ?? row.role
    const departmentId = patch.departmentId !== undefined ? patch.departmentId : row.departmentId
    const errors = checkUser(role, departmentId, patch.password)
    if (errors.length) return validationFailed(errors)
    Object.assign(row, patch, {
      role,
      departmentId: role === Role.HiringManager ? departmentId : null,
      updatedAt: new Date().toISOString(),
    })
    return ok(toUser(row), { message: 'User updated' })
  }),

  http.patch(api('/users/:id/status'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const row = db.users.find((u) => u.id === params.id)
    if (!row) return notFound('User')
    const { isActive } = (await request.json()) as { isActive: boolean }
    Object.assign(row, { isActive, updatedAt: new Date().toISOString() })
    return ok(toUser(row), { message: isActive ? 'User activated' : 'User deactivated' })
  }),

  http.delete(api('/users/:id'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.UserManage)
    if (auth instanceof Response) return auth
    const index = db.users.findIndex((u) => u.id === params.id)
    if (index < 0) return notFound('User')
    db.users.splice(index, 1)
    return ok(null, { message: 'User deleted' })
  }),

  // ----- departments -----
  http.get(api('/departments'), async ({ request }) => {
    await delay()
    const auth = authorize(request) // mọi user đăng nhập đều cần danh sách để chọn
    if (auth instanceof Response) return auth
    const params = searchParams(request)
    const search = params.get('search')
    const rows = db.departments.filter((d) => includesText(`${d.name} ${d.code}`, search))
    const { items, meta } = paginate(rows, params)
    return ok(items.map(departmentDto), { meta })
  }),

  http.post(api('/departments'), async ({ request }) => {
    await delay()
    const auth = authorize(request, Permission.DepartmentManage)
    if (auth instanceof Response) return auth
    const body = (await request.json()) as { name: string; code: string }
    if (db.departments.some((d) => d.code === body.code)) {
      return fail(409, 'CONFLICT', 'Code already exists', [
        { field: 'code', messages: ['Mã phòng ban đã tồn tại'] },
      ])
    }
    const row = { id: uid('dep'), ...body, createdAt: new Date().toISOString() }
    db.departments.push(row)
    return ok(departmentDto(row), { status: 201 })
  }),

  http.patch(api('/departments/:id'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.DepartmentManage)
    if (auth instanceof Response) return auth
    const row = db.departments.find((d) => d.id === params.id)
    if (!row) return notFound('Department')
    Object.assign(row, (await request.json()) as { name: string; code: string })
    return ok(departmentDto(row))
  }),

  http.delete(api('/departments/:id'), async ({ request, params }) => {
    await delay()
    const auth = authorize(request, Permission.DepartmentManage)
    if (auth instanceof Response) return auth
    const index = db.departments.findIndex((d) => d.id === params.id)
    if (index < 0) return notFound('Department')
    const { userCount, jobCount } = departmentDto(db.departments[index])
    if (userCount || jobCount) {
      return fail(409, 'DEPARTMENT_IN_USE', 'Department still has users or jobs')
    }
    db.departments.splice(index, 1)
    return ok(null)
  }),
]
