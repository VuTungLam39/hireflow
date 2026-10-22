import { z } from 'zod'

// Cùng quy tắc với backend (be/src/modules/users/dto/create-user.dto.ts)
export const passwordSchema = z
  .string()
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    'Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số',
  )

export const emailSchema = z.string().trim().toLowerCase().email('Email không hợp lệ')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Họ tên ít nhất 2 ký tự')
      .max(100, 'Họ tên tối đa 100 ký tự'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })
export type RegisterFormValues = z.input<typeof registerSchema>
export type RegisterFormOutput = z.output<typeof registerSchema>
/** Dữ liệu gửi lên API (không có confirmPassword) */
export type RegisterInput = Omit<RegisterFormOutput, 'confirmPassword'>

/** Đổi mật khẩu (API Contract 4.1, BR-ACC-06) */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
/** Dữ liệu gửi lên API (không có confirmPassword) */
export type ChangePasswordInput = Omit<ChangePasswordFormValues, 'confirmPassword'>
