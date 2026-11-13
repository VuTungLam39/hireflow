import { z } from 'zod'
import { pageFields, sortFields } from '@/hooks/use-list-params'
import { isoDayToVnText, vnTextToIsoDay } from '@/lib/vn-day'
import {
  BENEFITS_MAX,
  EMPLOYMENT_TYPE,
  HEADCOUNT_MAX,
  KEYWORD_LENGTH_MAX,
  KEYWORDS_MAX,
  REQUIREMENTS_MAX,
  SALARY_MAX_MILLION,
  JOB_LEVEL,
  JOB_SORT_FIELDS,
  JOB_STATUS,
  REQUIREMENT_TYPE,
  SALARY_VISIBILITY,
  WEIGHT_MAX,
  WEIGHT_MIN,
  WORK_MODE,
  type EmploymentType,
  type JobLevel,
  type SalaryVisibility,
  type WorkMode,
} from '../constants'
import type { Job, JobInput, RequirementInput } from '../types'

/** Bộ lọc danh sách job trên URL */
export const jobListSchema = z.object({
  ...pageFields,
  ...sortFields(JOB_SORT_FIELDS, 'createdAt'),
  search: z.string().optional().catch(undefined),
  status: z
    .enum(Object.keys(JOB_STATUS) as [keyof typeof JOB_STATUS])
    .optional()
    .catch(undefined),
  departmentId: z.string().optional().catch(undefined),
})
export type JobListParams = z.output<typeof jobListSchema>

const MILLION = 1_000_000
const millionsText = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || (/^\d{1,4}([.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) > 0),
    'Nhập số triệu, ví dụ 25 hoặc 12,5',
  )
  .refine(
    (v) => v === '' || Number(v.replace(',', '.')) <= SALARY_MAX_MILLION,
    `Tối đa ${SALARY_MAX_MILLION.toLocaleString('vi-VN')} triệu`,
  )
const toVnd = (v: string) => (v === '' ? null : Math.round(Number(v.replace(',', '.')) * MILLION))
const fromVnd = (v: number | null) => (v === null ? '' : String(v / MILLION).replace('.', ','))

export const jobInfoSchema = z
  .object({
    title: z.string().trim().min(5, 'Tiêu đề ít nhất 5 ký tự').max(200),
    departmentId: z.string().min(1, 'Chọn phòng ban'),
    location: z.string().trim().min(2, 'Nhập địa điểm').max(100),
    jdText: z.string().trim().min(50, 'Mô tả công việc ít nhất 50 ký tự'),
    // F-JOB-10 · BR-JOB-08: lương nhập theo triệu/tháng
    salaryMin: millionsText,
    salaryMax: millionsText,
    salaryVisibility: z.enum(Object.keys(SALARY_VISIBILITY) as [SalaryVisibility]),
    level: z.enum(['', ...(Object.keys(JOB_LEVEL) as [JobLevel])]),
    employmentType: z.enum(Object.keys(EMPLOYMENT_TYPE) as [EmploymentType]),
    workMode: z.enum(Object.keys(WORK_MODE) as [WorkMode]),
    headcount: z
      .number({ error: 'Nhập số người cần tuyển' })
      .int('Nhập số nguyên')
      .min(1, 'Ít nhất 1 người')
      .max(HEADCOUNT_MAX, `Tối đa ${HEADCOUNT_MAX}`),
    // BR-JOB-10: nhập dd/mm/yyyy như mọi ô ngày khác
    deadline: z
      .string()
      .trim()
      .refine((v) => v === '' || vnTextToIsoDay(v) !== null, 'Ngày không hợp lệ (dd/mm/yyyy)'),
    benefits: z.string().trim().max(BENEFITS_MAX, `Tối đa ${BENEFITS_MAX} ký tự`),
  })
  .superRefine((form, ctx) => {
    const min = toVnd(form.salaryMin)
    const max = toVnd(form.salaryMax)
    if (min !== null && max !== null && min > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['salaryMax'],
        message: 'Lương đến phải lớn hơn hoặc bằng lương từ',
      })
    }
    if (form.salaryVisibility === 'RANGE' && min === null && max === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['salaryMin'],
        message: 'Nhập ít nhất một mức lương, hoặc chọn hiện "Thoả thuận"',
      })
    }
  })
export type JobInfoForm = z.infer<typeof jobInfoSchema>

export const toJobInfoForm = (job: Job | undefined): JobInfoForm => ({
  title: job?.title ?? '',
  departmentId: job?.department.id ?? '',
  location: job?.location ?? '',
  jdText: job?.jdText ?? '',
  salaryMin: fromVnd(job?.salaryMin ?? null),
  salaryMax: fromVnd(job?.salaryMax ?? null),
  salaryVisibility: job?.salaryVisibility ?? 'NEGOTIABLE',
  level: job?.level ?? '',
  employmentType: job?.employmentType ?? 'FULL_TIME',
  workMode: job?.workMode ?? 'ONSITE',
  headcount: job?.headcount ?? 1,
  deadline: isoDayToVnText(job?.deadline),
  benefits: job?.benefits ?? '',
})

export const toJobInput = (form: JobInfoForm): JobInput => ({
  ...form,
  salaryMin: toVnd(form.salaryMin),
  salaryMax: toVnd(form.salaryMax),
  level: form.level === '' ? null : form.level,
  deadline: form.deadline === '' ? null : vnTextToIsoDay(form.deadline),
})

const requirementRowSchema = z.object({
  label: z.string().trim().min(2, 'Nhập tên tiêu chí').max(100),
  type: z.enum(Object.keys(REQUIREMENT_TYPE) as [keyof typeof REQUIREMENT_TYPE]),
  weight: z.number().int().min(WEIGHT_MIN).max(WEIGHT_MAX),
  minYears: z.number().min(0).max(30).nullable(),
  /** Trên form nhập dạng "nestjs, nest.js" */
  keywords: z
    .string()
    .trim()
    .min(1, 'Nhập ít nhất 1 từ khoá')
    .refine(
      (v) => v.split(',').filter((k) => k.trim()).length <= KEYWORDS_MAX,
      `Tối đa ${KEYWORDS_MAX} từ khoá`,
    )
    .refine(
      (v) => v.split(',').every((k) => k.trim().length <= KEYWORD_LENGTH_MAX),
      `Mỗi từ khoá tối đa ${KEYWORD_LENGTH_MAX} ký tự`,
    ),
})

export const requirementsFormSchema = z.object({
  requirements: z
    .array(requirementRowSchema)
    .min(1, 'Cần ít nhất 1 tiêu chí')
    .max(REQUIREMENTS_MAX, `Tối đa ${REQUIREMENTS_MAX} tiêu chí`),
})
export type RequirementsForm = z.infer<typeof requirementsFormSchema>
export type RequirementRow = RequirementsForm['requirements'][number]

export const toRequirementRow = (r: RequirementInput): RequirementRow => ({
  label: r.label,
  type: r.type,
  weight: r.weight,
  minYears: r.minYears,
  keywords: r.keywords.join(', '),
})

export const toRequirementInput = (row: RequirementRow): RequirementInput => ({
  ...row,
  keywords: row.keywords
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean),
})
