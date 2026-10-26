import { z } from 'zod'
import { pageFields } from '@/hooks/use-list-params'

export const publicJobsListSchema = z.object({
  ...pageFields,
  limit: z.coerce.number().int().min(1).max(50).catch(12),
  search: z.string().optional().catch(undefined),
})
