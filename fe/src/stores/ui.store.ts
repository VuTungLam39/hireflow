import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Density = 'comfortable' | 'compact'

interface UiState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  densityByUser: Record<string, Density>
  setDensity: (userId: string, density: Density) => void
}

const safeStorage = createJSONStorage(() => {
  try {
    return window.localStorage
  } catch {
    return undefined as unknown as Storage
  }
})

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      densityByUser: {},
      setDensity: (userId, density) =>
        set((s) => ({ densityByUser: { ...s.densityByUser, [userId]: density } })),
    }),
    {
      name: 'hireflow-ui',
      storage: safeStorage,
      partialize: (s) => ({ densityByUser: s.densityByUser }),
    },
  ),
)
