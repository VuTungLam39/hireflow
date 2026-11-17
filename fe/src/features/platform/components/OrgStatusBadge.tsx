import { cn } from '@/lib/utils'
import type { OrganizationStatus } from '@/types/user'
import { ORG_STATUS } from '../constants'

export function OrgStatusBadge({ status }: { status: OrganizationStatus }) {
  const s = ORG_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap',
        s.text,
      )}
    >
      <span aria-hidden className={cn('size-2 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
