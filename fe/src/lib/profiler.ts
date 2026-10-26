import type { ProfilerOnRenderCallback } from 'react'

// FE Architecture 9.1 · rendering.md
export const PROFILING = import.meta.env.MODE === 'profiling'

export interface ProfileSample {
  id: string
  phase: string
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
}

export interface ProfileStore {
  samples: ProfileSample[]
  renders: Record<string, number>
}

declare global {
  interface Window {
    __HIREFLOW_PROFILE__?: ProfileStore
  }
}

const store = () => (window.__HIREFLOW_PROFILE__ ??= { samples: [], renders: {} })

export const onProfilerRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (!PROFILING) return
  store().samples.push({ id, phase, actualDuration, baseDuration, startTime, commitTime })
}

export function countRender(name: string) {
  if (!PROFILING) return
  const renders = store().renders
  renders[name] = (renders[name] ?? 0) + 1
}
