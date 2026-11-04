import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Density = 'comfortable' | 'compact'

export interface Crumb {
  title: string
  back?: string
}

interface UiState {
  crumb: Crumb | null
  setCrumb: (crumb: Crumb | null) => void
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
      crumb: null,
      setCrumb: (crumb) => set({ crumb }),
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
