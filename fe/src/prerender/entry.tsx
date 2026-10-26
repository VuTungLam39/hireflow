import { dehydrate } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import {
  publicJobKeys,
  publicJobsListSchema,
  type PublicJob,
  type PublicJobSummary,
} from '@/features/public-jobs'
import { parseListParams } from '@/hooks/use-list-params'
import { queryClient } from '@/lib/query-client'
import { links, paths } from '@/routes/paths'
import { routes } from '@/routes/router'
import type { ApiResponse, Paginated } from '@/types/api'
import { jobTitle, PRERENDER_GLOBAL, SITE_NAME, type PrerenderPayload } from './shared'

// F-PUB-04 · Kickoff 15.1 · ADR-008 · FE Architecture 2.2

export interface PrerenderOptions {
  apiUrl: string
  siteUrl?: string
  fetchTimeoutMs?: number
}

export interface PrerenderedPage {
  path: string
  file: string
  html: string
  head: string
  payload: string
}

const LIST_DESCRIPTION = 'Các vị trí đang tuyển. Nộp CV chỉ trong một phút, mọi hồ sơ đều được đọc.'
const API_PAGE_LIMIT = 50

const serverRoutes = routes.map((route) => ({ ...route, loader: () => null }))

async function getJson<T>(url: string, timeoutMs: number): Promise<ApiResponse<T>> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return (await res.json()) as ApiResponse<T>
}

async function fetchAllSummaries(apiUrl: string, timeoutMs: number) {
  const items: PublicJobSummary[] = []
  for (let page = 1; ; page++) {
    const res = await getJson<PublicJobSummary[]>(
      `${apiUrl}/public/jobs?page=${page}&limit=${API_PAGE_LIMIT}`,
      timeoutMs,
    )
    items.push(...res.data)
    if (!res.meta?.hasNextPage) return items
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const serialize = (value: unknown) => JSON.stringify(value).replace(/</g, '\u003c')

const summarize = (text: string, max = 160) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

function buildHead(input: {
  title: string
  description: string
  path: string
  siteUrl?: string
  jsonLd?: object
}) {
  const url = input.siteUrl ? `${input.siteUrl.replace(/\/$/, '')}${input.path}` : undefined
  return [
    `<title>${escapeHtml(input.title)}</title>`,
    `<meta name="description" content="${escapeHtml(input.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(input.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(input.description)}" />`,
    url ? `<link rel="canonical" href="${escapeHtml(url)}" />` : '',
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : '',
    input.jsonLd ? `<script type="application/ld+json">${serialize(input.jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

const jobPostingJsonLd = (job: PublicJob) => ({
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: job.title,
  description: job.jdText,
  datePosted: job.publishedAt,
  employmentType: 'FULL_TIME',
  hiringOrganization: { '@type': 'Organization', name: 'HireFlow' },
  jobLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'VN' },
  },
})

async function renderUrl(path: string) {
  const handler = createStaticHandler(serverRoutes)
  const context = await handler.query(new Request(`http://prerender.local${path}`))
  if (context instanceof Response) throw new Error(`Route ${path} trả về redirect`)
  const router = createStaticRouter(handler.dataRoutes, context)
  const html = renderToString(
    <StrictMode>
      <AppProviders>
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </AppProviders>
    </StrictMode>,
  )
  const payload: PrerenderPayload = { queryState: dehydrate(queryClient) }
  return { html, payload: `window.${PRERENDER_GLOBAL}=${serialize(payload)}` }
}

export async function prerenderPublicPages(options: PrerenderOptions): Promise<PrerenderedPage[]> {
  const apiUrl = options.apiUrl.replace(/\/$/, '')
  const timeoutMs = options.fetchTimeoutMs ?? 90_000
  const pages: PrerenderedPage[] = []

  const listParams = parseListParams(publicJobsListSchema, new URLSearchParams())
  const firstPage = await getJson<PublicJobSummary[]>(
    `${apiUrl}/public/jobs?page=${listParams.page}&limit=${listParams.limit}`,
    timeoutMs,
  )
  queryClient.clear()
  queryClient.setQueryData<Paginated<PublicJobSummary>>(publicJobKeys.list(listParams), {
    items: firstPage.data,
    meta: firstPage.meta!,
  })
  pages.push({
    path: paths.publicJobs,
    file: 'jobs.html',
    head: buildHead({
      title: `Việc làm đang tuyển – ${SITE_NAME}`,
      description: LIST_DESCRIPTION,
      path: paths.publicJobs,
      siteUrl: options.siteUrl,
    }),
    ...(await renderUrl(paths.publicJobs)),
  })

  for (const summary of await fetchAllSummaries(apiUrl, timeoutMs)) {
    const job = (await getJson<PublicJob>(`${apiUrl}/public/jobs/${summary.id}`, timeoutMs)).data
    const path = links.publicJobDetail(job.id)
    queryClient.clear()
    queryClient.setQueryData(publicJobKeys.detail(job.id), job)
    pages.push({
      path,
      file: `jobs/${job.id}.html`,
      head: buildHead({
        title: jobTitle(job.title),
        description: summarize(
          `${job.title} · ${job.department.name} · ${job.location}. ${job.jdText}`,
        ),
        path,
        siteUrl: options.siteUrl,
        jsonLd: jobPostingJsonLd(job),
      }),
      ...(await renderUrl(path)),
    })
  }

  queryClient.clear()
  return pages
}
