import { z } from 'zod'
import { EMPLOYMENT_TYPE, JOB_LEVEL, WORK_MODE } from '@/features/jobs'
import { pageFields } from '@/hooks/use-list-params'

const keysOf = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string]

export const publicJobsListSchema = z.object({
  ...pageFields,
  limit: z.coerce.number().int().min(1).max(50).catch(12),
  search: z.string().optional().catch(undefined),
  departmentId: z.string().min(1).optional().catch(undefined),
  // MVP 3 · US-22
  company: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .optional()
    .catch(undefined),
  location: z.string().trim().min(1).max(100).optional().catch(undefined),
  // F-PUB-05
  level: z.enum(keysOf(JOB_LEVEL)).optional().catch(undefined),
  employmentType: z.enum(keysOf(EMPLOYMENT_TYPE)).optional().catch(undefined),
  workMode: z.enum(keysOf(WORK_MODE)).optional().catch(undefined),
})
export type PublicJobsListParams = z.output<typeof publicJobsListSchema>

export const companiesListSchema = z.object({
  ...pageFields,
  limit: z.coerce.number().int().min(1).max(48).catch(24),
  search: z.string().optional().catch(undefined),
})
export type CompaniesListParams = z.output<typeof companiesListSchema>
