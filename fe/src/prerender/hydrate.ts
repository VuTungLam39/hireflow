import { hydrate } from '@tanstack/react-query'
import { matchRoutes, type RouteObject } from 'react-router'
import { queryClient } from '@/lib/query-client'
import { PRERENDER_GLOBAL, type PrerenderPayload } from './shared'

declare global {
  interface Window {
    [PRERENDER_GLOBAL]?: PrerenderPayload
  }
}

export function readPrerenderPayload(): PrerenderPayload | undefined {
  return window[PRERENDER_GLOBAL]
}

export function hydrateQueryCache(payload: PrerenderPayload) {
  hydrate(queryClient, payload.queryState)
}

export async function resolveLazyRoutes(routes: RouteObject[], location: Location) {
  const matches = matchRoutes(routes, location) ?? []
  await Promise.all(
    matches.map(async ({ route }) => {
      if (typeof route.lazy !== 'function') return
      const loaded = await route.lazy()
      Object.assign(route, { ...loaded, lazy: undefined })
    }),
  )
}
