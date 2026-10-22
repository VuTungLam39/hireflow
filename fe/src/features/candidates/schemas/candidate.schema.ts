import { z } from 'zod'

/** Bộ lọc kho ứng viên trên URL. Cursor không lưu trên URL: nó thuộc về lần cuộn hiện tại. */
export const candidateListSchema = z.object({
  search: z.string().optional().catch(undefined),
})
export type CandidateListFilter = z.output<typeof candidateListSchema>

/** Sửa thông tin liên hệ – không sửa email (BR-CAND-01) */
export const candidateContactSchema = z.object({
  fullName: z.string().trim().min(2, 'Nhập họ tên').max(100),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(\+84|0)\d{9,10}$/.test(v), 'Số điện thoại không hợp lệ'),
})
export type CandidateContactForm = z.infer<typeof candidateContactSchema>
