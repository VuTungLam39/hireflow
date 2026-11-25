import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { useLocation } from 'react-router'
import { applicationQueries } from '@/features/applications'
import { usePermission } from '@/hooks/use-permission'
import { hasPermission, Permission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth.store'
import { findNavItem, navGroups } from './nav-config'

export interface RailItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  badgeCount?: number
}

export interface RailGroup {
  title: string
  items: RailItem[]
}

function usePendingCount() {
  const allowed = usePermission(Permission.ApplicationRead)
  const query = useQuery({
    ...applicationQueries.list({
      page: 1,
      limit: 1,
      status: 'NEW',
      sortBy: 'createdAt',
      order: 'DESC',
    }),
    enabled: allowed,
    staleTime: 60_000,
  })
  return query.data?.meta?.totalItems
}

export function useNavGroups(): { groups: RailGroup[]; activeId: string | undefined } {
  const user = useAuthStore((s) => s.user)
  const pending = usePendingCount()
  const { pathname } = useLocation()

  const groups = navGroups
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => hasPermission(user, item.permission))
        .map((item) => ({
          id: item.to,
          label: item.label,
          icon: item.icon,
          href: item.to,
          badgeCount: item.badge === 'pending' ? pending : undefined,
        })),
    }))
    .filter((group) => group.items.length > 0)

  return { groups, activeId: findNavItem(pathname)?.item.to }
}
