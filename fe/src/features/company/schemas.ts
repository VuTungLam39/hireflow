import { z } from 'zod'
import { COMPANY_SIZE, type Company, type CompanyInput, type CompanySize } from './types'

// BR-ORG-02: chỉ https://
const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === '' || /^https:\/\/[^\s]+\.[^\s]+/.test(v),
    'Đường dẫn phải bắt đầu bằng https://',
  )
const optional = (v: string) => (v.trim() === '' ? null : v.trim())

export const companyInfoSchema = z.object({
  name: z.string().trim().min(2, 'Nhập tên công ty').max(150),
  tagline: z.string().trim().max(200),
  about: z.string().trim().max(5000, 'Tối đa 5.000 ký tự'),
  sizeRange: z.enum(['', ...(Object.keys(COMPANY_SIZE) as [CompanySize])]),
  foundedYear: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\d{4}$/.test(v) && +v >= 1800 && +v <= 2100),
      'Nhập năm, ví dụ 2016',
    ),
  industries: z
    .string()
    .trim()
    .refine((v) => v.split(',').filter((s) => s.trim()).length <= 5, 'Tối đa 5 lĩnh vực'),
  website: httpsUrl,
  linkedin: httpsUrl,
  facebook: httpsUrl,
  youtube: httpsUrl,
  tiktok: httpsUrl,
})
export type CompanyInfoForm = z.infer<typeof companyInfoSchema>

export const toInfoForm = (c: Company): CompanyInfoForm => ({
  name: c.name,
  tagline: c.tagline,
  about: c.about,
  sizeRange: c.sizeRange ?? '',
  foundedYear: c.foundedYear ? String(c.foundedYear) : '',
  industries: c.industries.join(', '),
  website: c.website ?? '',
  linkedin: c.socials.linkedin ?? '',
  facebook: c.socials.facebook ?? '',
  youtube: c.socials.youtube ?? '',
  tiktok: c.socials.tiktok ?? '',
})

export const toInfoInput = (f: CompanyInfoForm): CompanyInput => ({
  name: f.name,
  tagline: f.tagline,
  about: f.about,
  sizeRange: f.sizeRange === '' ? null : f.sizeRange,
  foundedYear: f.foundedYear === '' ? null : Number(f.foundedYear),
  industries: f.industries
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  website: optional(f.website),
  socials: {
    linkedin: optional(f.linkedin),
    facebook: optional(f.facebook),
    youtube: optional(f.youtube),
    tiktok: optional(f.tiktok),
  },
})

export const benefitsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(2, 'Nhập tên phúc lợi').max(80),
        description: z.string().trim().max(300),
      }),
    )
    .max(12, 'Tối đa 12 phúc lợi'),
})

export const officesSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(2, 'Nhập tên văn phòng').max(100),
        address: z.string().trim().min(5, 'Nhập địa chỉ').max(300),
        mapUrl: httpsUrl,
      }),
    )
    .max(10, 'Tối đa 10 văn phòng'),
})

export const milestonesSchema = z.object({
  items: z
    .array(
      z.object({
        year: z
          .string()
          .trim()
          .refine((v) => /^\d{4}$/.test(v) && +v >= 1800 && +v <= 2100, 'Nhập năm'),
        title: z.string().trim().min(2, 'Nhập mốc').max(150),
        description: z.string().trim().max(500),
      }),
    )
    .max(20, 'Tối đa 20 mốc'),
})
