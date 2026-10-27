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
import { interviewKeys } from '@/features/interviews'
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

const when = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(iso))

export function notificationText(n: NotificationItem): string {
  const name = n.application?.candidateName ?? 'Ứng viên'
  const iv = n.interview
  switch (n.type) {
    case 'INTERVIEW_ASSIGNED':
      return `Bạn được phân công phỏng vấn ${name}${iv ? ` lúc ${when(iv.scheduledAt)}` : ''}`
    case 'INTERVIEW_UPDATED':
      return `Lịch phỏng vấn ${name} đổi sang ${iv ? when(iv.scheduledAt) : 'giờ mới'}`
    case 'INTERVIEW_CANCELLED':
      return `Buổi phỏng vấn ${name} đã huỷ hoặc bạn không còn được phân công`
    case 'FEEDBACK_SUBMITTED':
      return `Có phiếu đánh giá mới cho ${name}`
  }
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
        if (event.data.notification.interview) {
          void queryClient.invalidateQueries({ queryKey: interviewKeys.all })
        }
        const n = event.data.notification
        const show =
          n.type === 'CV_FAILED' || n.type === 'INTERVIEW_CANCELLED' ? toast.error : toast.info
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
