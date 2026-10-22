import { z } from 'zod'
import { pageFields, sortFields } from '@/hooks/use-list-params'
import { JOB_SORT_FIELDS, JOB_STATUS, REQUIREMENT_TYPE, WEIGHT_MAX, WEIGHT_MIN } from '../constants'
import type { RequirementInput } from '../types'

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

export const jobInfoSchema = z.object({
  title: z.string().trim().min(5, 'Tiêu đề ít nhất 5 ký tự').max(200),
  departmentId: z.string().min(1, 'Chọn phòng ban'),
  location: z.string().trim().min(2, 'Nhập địa điểm').max(100),
  jdText: z.string().trim().min(50, 'Mô tả công việc ít nhất 50 ký tự'),
})
export type JobInfoForm = z.infer<typeof jobInfoSchema>

const requirementRowSchema = z.object({
  label: z.string().trim().min(2, 'Nhập tên tiêu chí').max(100),
  type: z.enum(Object.keys(REQUIREMENT_TYPE) as [keyof typeof REQUIREMENT_TYPE]),
  weight: z.number().int().min(WEIGHT_MIN).max(WEIGHT_MAX),
  minYears: z.number().min(0).max(30).nullable(),
  /** Trên form nhập dạng "nestjs, nest.js" */
  keywords: z.string().trim().min(1, 'Nhập ít nhất 1 từ khoá'),
})

export const requirementsFormSchema = z.object({
  requirements: z.array(requirementRowSchema).min(1, 'Cần ít nhất 1 tiêu chí'),
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
