import { dehydrate } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { companyKeys, mediaSrc, type PublicCompany } from '@/features/company'
import {
  publicJobKeys,
  publicJobsListSchema,
  type PublicDepartmentCount,
  type PublicJob,
  type PublicJobSummary,
} from '@/features/public-jobs'
import { parseListParams } from '@/hooks/use-list-params'
import { queryClient } from '@/lib/query-client'
import { links, paths } from '@/routes/paths'
import { routes } from '@/routes/router'
import type { ApiResponse, Paginated } from '@/types/api'
import { absoluteUrl, jobPostingJsonLd, organizationJsonLd } from './json-ld'
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

/** BR-ORG-01: hồ sơ chưa công khai trả 404 → không dựng /careers, các trang khác vẫn dựng */
async function fetchCompany(apiUrl: string, timeoutMs: number): Promise<PublicCompany | null> {
  const res = await fetch(`${apiUrl}/public/company`, { signal: AbortSignal.timeout(timeoutMs) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${apiUrl}/public/company → ${res.status}`)
  return ((await res.json()) as ApiResponse<PublicCompany>).data
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

/** Trong <script>, "</script>" hay "<!--" nằm trong dữ liệu không được kết thúc thẻ sớm */
const serialize = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

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
  /** Ảnh LCP: tải song song với CSS thay vì đợi CSS xong mới thấy thẻ img */
  preloadImage?: string
  ogImage?: string
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
    input.ogImage ? `<meta property="og:image" content="${escapeHtml(input.ogImage)}" />` : '',
    input.preloadImage
      ? `<link rel="preload" as="image" href="${escapeHtml(input.preloadImage)}" fetchpriority="high" />`
      : '',
    input.jsonLd ? `<script type="application/ld+json">${serialize(input.jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

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

  const company = await fetchCompany(apiUrl, timeoutMs)
  const listParams = parseListParams(publicJobsListSchema, new URLSearchParams())
  const firstPage = await getJson<PublicJobSummary[]>(
    `${apiUrl}/public/jobs?page=${listParams.page}&limit=${listParams.limit}`,
    timeoutMs,
  )
  const firstPageData: Paginated<PublicJobSummary> = {
    items: firstPage.data,
    meta: firstPage.meta!,
  }
  /** Mỗi trang bắt đầu từ cache trống, chỉ có hồ sơ công ty (header, khối "Về công ty") */
  const resetCache = () => {
    queryClient.clear()
    if (company) queryClient.setQueryData(companyKeys.public(), company)
  }

  // Hàng chip phòng ban có sẵn trong HTML, không đẩy danh sách xuống sau khi hydrate (CLS)
  const departments = await getJson<PublicDepartmentCount[]>(
    `${apiUrl}/public/jobs/departments`,
    timeoutMs,
  )

  resetCache()
  queryClient.setQueryData(publicJobKeys.list(listParams), firstPageData)
  queryClient.setQueryData(publicJobKeys.departments(listParams.search), departments.data)
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
    resetCache()
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
        jsonLd: jobPostingJsonLd(job, company, options.siteUrl),
      }),
      ...(await renderUrl(path)),
    })
  }

  if (company) {
    resetCache()
    queryClient.setQueryData(publicJobKeys.list(listParams), firstPageData)
    pages.push({
      path: paths.careers,
      file: 'careers.html',
      head: buildHead({
        title: `${company.name} – ${SITE_NAME}`,
        description: summarize(
          company.tagline ? `${company.tagline}. ${company.about}` : company.about,
        ),
        path: paths.careers,
        siteUrl: options.siteUrl,
        jsonLd: organizationJsonLd(company, options.siteUrl),
        preloadImage: company.cover ? mediaSrc(company.cover) : undefined,
        ogImage: company.cover ? absoluteUrl(mediaSrc(company.cover), options.siteUrl) : undefined,
      }),
      ...(await renderUrl(paths.careers)),
    })
  }

  queryClient.clear()
  return pages
}

/** E4: sitemap gồm đúng các trang đã dựng sẵn (tin OPEN chưa hết hạn, /jobs, /careers) */
export function buildSitemap(pages: Pick<PrerenderedPage, 'path'>[], siteUrl: string) {
  const base = siteUrl.replace(/\/$/, '')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((page) => `  <url><loc>${escapeHtml(`${base}${page.path}`)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')
}
