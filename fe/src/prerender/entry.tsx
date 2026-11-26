import { dehydrate } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { mediaSrc } from '@/features/company'
import {
  companiesListSchema,
  publicJobKeys,
  publicJobsListSchema,
  type PublicCompanyCard,
  type PublicCompanyPage,
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
const COMPANY_PAGE_LIMIT = 48
const COMPANIES_DESCRIPTION =
  'Các công ty đang tuyển trên HireFlow: giới thiệu, phúc lợi và vị trí đang mở.'

const serverRoutes = routes.map((route) => ({ ...route, loader: () => null }))

async function getJson<T>(url: string, timeoutMs: number): Promise<ApiResponse<T>> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return (await res.json()) as ApiResponse<T>
}

// MVP 3 · KH 9.6: mọi công ty ACTIVE có trang công ty
async function fetchAllCompanies(apiUrl: string, timeoutMs: number) {
  const items: PublicCompanyCard[] = []
  for (let page = 1; ; page++) {
    const res = await getJson<PublicCompanyCard[]>(
      `${apiUrl}/public/companies?page=${page}&limit=${COMPANY_PAGE_LIMIT}`,
      timeoutMs,
    )
    items.push(...res.data)
    if (!res.meta?.hasNextPage) return items
  }
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

  const cards = await fetchAllCompanies(apiUrl, timeoutMs)
  const companies = new Map<string, PublicCompanyPage>()
  for (const card of cards) {
    const page = await getJson<PublicCompanyPage>(
      `${apiUrl}/public/companies/${card.slug}`,
      timeoutMs,
    )
    companies.set(card.slug, page.data)
  }
  const listParams = parseListParams(publicJobsListSchema, new URLSearchParams())
  const firstPage = await getJson<PublicJobSummary[]>(
    `${apiUrl}/public/jobs?page=${listParams.page}&limit=${listParams.limit}`,
    timeoutMs,
  )
  const firstPageData: Paginated<PublicJobSummary> = {
    items: firstPage.data,
    meta: firstPage.meta!,
  }
  const page = <T,>(items: T[], limit: number): Paginated<T> => ({
    items: items.slice(0, limit),
    meta: {
      page: 1,
      limit,
      totalItems: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
      hasNextPage: items.length > limit,
      hasPreviousPage: false,
    },
  })
  const resetCache = () => queryClient.clear()
  const coverOf = (c: PublicCompanyPage | undefined) => c?.cover ?? c?.logo ?? null

  // Hàng chip công ty có sẵn trong HTML, không đẩy danh sách xuống sau khi hydrate (CLS)
  resetCache()
  queryClient.setQueryData(publicJobKeys.list(listParams), firstPageData)
  queryClient.setQueryData(
    publicJobKeys.companies({ page: 1, limit: COMPANY_PAGE_LIMIT }),
    page(cards, COMPANY_PAGE_LIMIT),
  )
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
    // DL-17
    if (job.expired) continue
    const path = links.publicJobDetail(job.id)
    // US-24: og:image lấy ảnh bìa hoặc logo của công ty đăng tin
    const image = coverOf(companies.get(job.company.slug))
    resetCache()
    queryClient.setQueryData(publicJobKeys.detail(job.id), job)
    pages.push({
      path,
      file: `jobs/${job.id}.html`,
      head: buildHead({
        title: jobTitle(job.title),
        description: summarize(
          `${job.title} · ${job.company.name} · ${job.location}. ${job.jdText}`,
        ),
        path,
        siteUrl: options.siteUrl,
        jsonLd: jobPostingJsonLd(job, options.siteUrl),
        ogImage: image ? absoluteUrl(mediaSrc(image), options.siteUrl) : undefined,
      }),
      ...(await renderUrl(path)),
    })
  }

  const directoryParams = parseListParams(companiesListSchema, new URLSearchParams())
  resetCache()
  queryClient.setQueryData(
    publicJobKeys.companies(directoryParams),
    page(cards, directoryParams.limit),
  )
  pages.push({
    path: paths.publicCompanies,
    file: 'companies.html',
    head: buildHead({
      title: `Công ty đang tuyển – ${SITE_NAME}`,
      description: COMPANIES_DESCRIPTION,
      path: paths.publicCompanies,
      siteUrl: options.siteUrl,
    }),
    ...(await renderUrl(paths.publicCompanies)),
  })

  for (const company of companies.values()) {
    const path = links.publicCompany(company.slug)
    resetCache()
    queryClient.setQueryData(publicJobKeys.company(company.slug), company)
    pages.push({
      path,
      file: `companies/${company.slug}.html`,
      head: buildHead({
        title: `${company.name} – ${SITE_NAME}`,
        description: summarize(
          company.tagline ? `${company.tagline}. ${company.about}` : company.about,
        ),
        path,
        siteUrl: options.siteUrl,
        jsonLd: organizationJsonLd(company, options.siteUrl),
        preloadImage: company.cover ? mediaSrc(company.cover) : undefined,
        ogImage: coverOf(company)
          ? absoluteUrl(mediaSrc(coverOf(company)!), options.siteUrl)
          : undefined,
      }),
      ...(await renderUrl(path)),
    })
  }

  resetCache()
  pages.push({
    path: paths.privacy,
    file: 'chinh-sach-du-lieu.html',
    head: buildHead({
      title: `Chính sách dữ liệu ứng viên – ${SITE_NAME}`,
      description: 'Cách bản demo HireFlow xử lý, lưu trữ và xoá dữ liệu trong hồ sơ ứng viên.',
      path: paths.privacy,
      siteUrl: options.siteUrl,
    }),
    ...(await renderUrl(paths.privacy)),
  })

  queryClient.clear()
  return pages
}

/** E4: sitemap gồm đúng các trang đã dựng sẵn (tin OPEN chưa hết hạn, /jobs, /companies, mọi trang công ty) */
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
