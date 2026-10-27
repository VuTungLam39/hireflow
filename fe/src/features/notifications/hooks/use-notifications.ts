import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { applicationKeys } from '@/features/applications'
import { dashboardKeys } from '@/features/dashboard'
import { jobKeys } from '@/features/jobs'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth.store'
import { useRealtimeStore } from '@/stores/realtime.store'
import { notificationsApi } from '../api/notifications.api'
import { connectRealtime } from '../lib/realtime-connection'
import type { NotificationItem, RealtimeEvent } from '../types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
}

export const LIST_REFRESH_DEBOUNCE_MS = 500

export function notificationText(n: NotificationItem): string {
  const name = n.application?.candidateName ?? 'Ứng viên'
  if (n.type === 'CV_FAILED') return `Chấm CV của ${name} thất bại`
  const score = n.application?.score
  return score === null || score === undefined
    ? `CV của ${name} đã chấm xong`
    : `CV của ${name} đã chấm xong: ${score} điểm`
}

function createEventHandler(queryClient: QueryClient) {
  let pending: ReturnType<typeof setTimeout> | null = null
  const refreshLists = () => {
    if (pending) return
    pending = setTimeout(() => {
      pending = null
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      void queryClient.invalidateQueries({ queryKey: jobKeys.all })
    }, LIST_REFRESH_DEBOUNCE_MS)
  }

  return (event: RealtimeEvent) => {
    const store = useRealtimeStore.getState()
    switch (event.event) {
      case 'ready':
        store.setUnreadCount(event.data.unreadCount)
        return
      case 'notification': {
        store.setUnreadCount(event.data.unreadCount)
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
        const n = event.data.notification
        const show = n.type === 'CV_FAILED' ? toast.error : toast.info
        show(notificationText(n), { description: n.application?.jobTitle })
        return
      }
      case 'application':
        void queryClient.invalidateQueries({
          queryKey: applicationKeys.detail(event.data.applicationId),
        })
        refreshLists()
        return
    }
  }
}

// F-NOTI-01: gọi một lần ở layout sau đăng nhập
export function useRealtimeConnection() {
  const queryClient = useQueryClient()
  const signedIn = useAuthStore((s) => !!s.user)

  useEffect(() => {
    if (!signedIn) return
    return connectRealtime({
      onEvent: createEventHandler(queryClient),
      onStatus: (connected) => useRealtimeStore.getState().setConnected(connected),
    })
  }, [signedIn, queryClient])
}

export function useNotifications(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => notificationsApi.list({ cursor: pageParam, limit: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    enabled,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: ({ unreadCount }) => {
      useRealtimeStore.getState().setUnreadCount(unreadCount)
      return queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: ({ unreadCount }) => {
      useRealtimeStore.getState().setUnreadCount(unreadCount)
      return queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
