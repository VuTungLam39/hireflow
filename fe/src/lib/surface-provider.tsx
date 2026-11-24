import type { ReactNode } from 'react'
import { SurfaceContext, type Surface } from './terms'

export function SurfaceProvider({ value, children }: { value: Surface; children: ReactNode }) {
  return <SurfaceContext value={value}>{children}</SurfaceContext>
}
