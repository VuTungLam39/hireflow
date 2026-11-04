import { usePermission } from '@/hooks/use-permission'
import { Permission } from '@/lib/permissions'

export function useQuickSearchScope() {
  const candidates = usePermission(Permission.CandidateRead)
  const applications = usePermission(Permission.ApplicationRead)
  return candidates ? 'candidates' : applications ? 'applications' : 'pages'
}

export const QUICK_SEARCH_LABEL = {
  candidates: 'Tìm ứng viên',
  applications: 'Tìm hồ sơ',
  pages: 'Tìm trang',
} as const
