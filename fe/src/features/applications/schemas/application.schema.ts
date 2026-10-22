import { z } from 'zod'
import { pageFields, sortFields } from '@/hooks/use-list-params'
import { APPLICATION_SORT_FIELDS, APPLICATION_STATUSES } from '../constants'

const score = z.coerce.number().int().min(0).max(100).optional().catch(undefined)
/** Ngày dạng YYYY-MM-DD (giờ Việt Nam), tính cả hai đầu */
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

/** Bộ lọc bảng application trên URL (US-06) */
export const applicationListSchema = z.object({
  ...pageFields,
  ...sortFields(APPLICATION_SORT_FIELDS, 'createdAt'),
  search: z.string().optional().catch(undefined),
  jobId: z.string().optional().catch(undefined),
  status: z.enum(APPLICATION_STATUSES).optional().catch(undefined),
  scoreMin: score,
  scoreMax: score,
  /** Cờ "thiếu tiêu chí bắt buộc" */
  missingMust: z.enum(['true']).optional().catch(undefined),
  createdFrom: day,
  createdTo: day,
})
export type ApplicationListParams = z.output<typeof applicationListSchema>
