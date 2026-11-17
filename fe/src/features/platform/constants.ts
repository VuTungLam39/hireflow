import type { OrganizationStatus } from '@/types/user'

// BR-ORG-04
export const ORG_STATUS: Record<OrganizationStatus, { label: string; dot: string; text: string }> =
  {
    PENDING: { label: 'Chờ duyệt', dot: 'bg-warn', text: 'text-warn' },
    ACTIVE: { label: 'Đang hoạt động', dot: 'bg-good', text: 'text-good-ink' },
    SUSPENDED: { label: 'Đã khoá', dot: 'bg-bad', text: 'text-bad' },
    REJECTED: { label: 'Bị từ chối', dot: 'bg-ink-faint', text: 'text-ink-muted' },
  }
