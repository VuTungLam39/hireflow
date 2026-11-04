import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'
import type { Job } from '../types'

export function useCanEditJob(job: Job | undefined) {
  const allowed = usePermission(job ? Permission.JobUpdate : Permission.JobCreate)
  return allowed && job?.status !== 'CLOSED'
}
