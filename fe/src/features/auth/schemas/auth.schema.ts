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
