import { create } from 'zustand'

interface UiState {
  /** Sidebar dạng ngăn kéo trên mobile (dưới 768px) */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

/** State giao diện toàn cục (UI shell). Dữ liệu server không đặt ở đây. */
export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
