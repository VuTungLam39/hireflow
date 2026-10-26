import type { DehydratedState } from '@tanstack/react-query'

// F-PUB-04 · Kickoff 15.1 · ADR-008
export const PRERENDER_GLOBAL = '__HIREFLOW_PRERENDER__'

export interface PrerenderPayload {
  queryState: DehydratedState
}

export const SITE_NAME = 'HireFlow Careers'

export const jobTitle = (title: string) => `${title} – ${SITE_NAME}`
