import { useAuthStore } from '@/stores/auth.store'
import { useUiStore, type Density } from '@/stores/ui.store'

export function useDensity(fallback: Density = 'comfortable') {
  const userId = useAuthStore((s) => s.user?.id ?? 'guest')
  const density = useUiStore((s) => s.densityByUser[userId] ?? fallback)
  const setDensity = useUiStore((s) => s.setDensity)
  return [density, (next: Density) => setDensity(userId, next)] as const
}
