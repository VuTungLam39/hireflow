import { api } from '@/lib/api-client'
import type { ApiResponse, CursorMeta, CursorPage } from '@/types/api'
import type { NotificationItem } from '../types'

export const notificationsApi = {
  list: async (params: {
    cursor?: string
    limit?: number
  }): Promise<CursorPage<NotificationItem>> => {
    const res = await api.get<ApiResponse<NotificationItem[], CursorMeta>>('/notifications', {
      params,
    })
    return { items: res.data.data, meta: res.data.meta! }
  },

  unreadCount: async () =>
    (await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count')).data.data,

  markRead: async (id: string) =>
    (await api.patch<ApiResponse<{ unreadCount: number }>>(`/notifications/${id}/read`)).data.data,

  markAllRead: async () =>
    (await api.patch<ApiResponse<{ unreadCount: number }>>('/notifications/read-all')).data.data,
}
