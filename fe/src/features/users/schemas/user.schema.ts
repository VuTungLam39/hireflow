import { z } from 'zod'
import { emailSchema, passwordSchema } from '@/features/auth'
import { Role } from '@/types/user'

const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Họ tên ít nhất 2 ký tự')
  .max(100, 'Họ tên tối đa 100 ký tự')
const roleSchema = z.enum([Role.Admin, Role.Hr, Role.HiringManager, Role.Interviewer])

/** BR-ACC-03: Hiring Manager bắt buộc thuộc một phòng ban */
const departmentRequired = {
  check: (v: { role?: Role; departmentId?: string }) =>
    v.role !== Role.HiringManager || !!v.departmentId,
  issue: { path: ['departmentId'], message: 'Hiring Manager phải thuộc một phòng ban' },
}

/** BR-ACC-03: chỉ Hiring Manager gắn phòng ban; Admin và HR luôn gửi null */
export const departmentFor = (role: Role, departmentId: string | undefined) =>
  role === Role.HiringManager && departmentId ? departmentId : null

export const createUserSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    // Ô bị khoá (role khác Hiring Manager) thì react-hook-form trả undefined
    departmentId: z.string().optional(),
  })
  .refine(departmentRequired.check, departmentRequired.issue)
export type CreateUserForm = z.infer<typeof createUserSchema>

export const editUserSchema = z
  .object({
    fullName: fullNameSchema,
    // undefined khi Admin sửa chính mình (ô vai trò bị khoá)
    role: roleSchema.optional(),
    departmentId: z.string().optional(),
    // Để trống thì giữ mật khẩu cũ
    password: z.literal('').or(passwordSchema),
  })
  .refine(departmentRequired.check, departmentRequired.issue)
export type EditUserForm = z.infer<typeof editUserSchema>
