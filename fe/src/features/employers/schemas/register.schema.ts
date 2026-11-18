import { z } from 'zod'
import { emailSchema, passwordSchema } from '@/features/auth'

// Cùng quy tắc với be/src/modules/organizations/dto/register-employer.dto.ts (BR-ORG-05)
export const registerEmployerSchema = z.object({
  companyName: z.string().trim().min(2, 'Tên công ty ít nhất 2 ký tự').max(150),
  taxCode: z
    .string()
    .trim()
    .regex(/^\d{10}(\d{3})?$/, 'Mã số thuế gồm 10 hoặc 13 chữ số'),
  website: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === '' || /^https:\/\/[^\s.]+\.[^\s]+$/.test(v), {
      message: 'Website phải bắt đầu bằng https://',
    }),
  fullName: z.string().trim().min(2, 'Họ tên ít nhất 2 ký tự').max(100),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.boolean().refine((v) => v, { message: 'Cần đồng ý điều khoản sử dụng sàn' }),
})

export type RegisterEmployerForm = z.infer<typeof registerEmployerSchema>

export type RegisterEmployerInput = Omit<RegisterEmployerForm, 'website'> & {
  website?: string
  acceptTerms: true
}
