import { create } from 'zustand'

interface RealtimeState {
  /** Kết nối SSE thông báo đang mở (F-NOTI-01) */
  connected: boolean
  unreadCount: number
  setConnected: (connected: boolean) => void
  setUnreadCount: (unreadCount: number) => void
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  connected: false,
  unreadCount: 0,
  setConnected: (connected) => set({ connected }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}))
