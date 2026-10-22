import { Badge } from '@/components/ui'
import { JOB_STATUS, REQUIREMENT_TYPE, type JobStatus, type RequirementType } from '../constants'

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, tone } = JOB_STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function RequirementTypeBadge({ type }: { type: RequirementType }) {
  const { label, tone } = REQUIREMENT_TYPE[type]
  return <Badge tone={tone}>{label}</Badge>
}
