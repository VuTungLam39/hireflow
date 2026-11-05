import { act, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/providers'
import { queryClient } from '@/lib/query-client'
import { createAppRouter, ROOT_ROUTE_ID, routes } from '@/routes/router'
import { buildSitemap, prerenderPublicPages } from './entry'
import { hydrateQueryCache, resolveLazyRoutes } from './hydrate'
import { PRERENDER_GLOBAL, type PrerenderPayload } from './shared'

const API = 'http://api.test/api/v1'
const job = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Backend Developer (NestJS)',
  location: 'Hà Nội',
  department: { name: 'Kỹ thuật' },
  publishedAt: '2026-10-20T02:00:00.000Z',
  salary: { mode: 'RANGE', min: 25_000_000, max: 40_000_000 },
  level: 'MIDDLE',
  employmentType: 'FULL_TIME',
  workMode: 'HYBRID',
  headcount: 2,
  deadline: null,
}
const detail = {
  ...job,
  expired: false,
  benefits: 'Lương tháng 13',
  jdText: 'Xây dựng API bằng NestJS và PostgreSQL.',
  requirements: [
    { label: 'NestJS', type: 'MUST' },
    { label: 'Docker', type: 'NICE' },
  ],
}
const meta = {
  page: 1,
  limit: 12,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
const logo = {
  id: 'm1',
  kind: 'LOGO',
  url: `/public/media/${'a'.repeat(64)}.png`,
  width: 256,
  height: 256,
  alt: 'Logo',
  position: 0,
}
const company = {
  name: 'Công ty Cổ phần HireFlow',
  tagline: 'Đọc kỹ từng hồ sơ',
  about: ['HireFlow xây dựng phần mềm tuyển dụng.', 'Đội ngũ hơn 200 người.'].join('\n\n'),
  sizeRange: '201-500',
  industries: ['Phần mềm'],
  foundedYear: 2016,
  website: 'https://hireflow.example.com',
  socials: {},
  benefits: [{ title: 'Bảo hiểm sức khoẻ', description: 'Cho cả gia đình' }],
  offices: [],
  milestones: [{ year: 2016, title: 'Thành lập', description: '' }],
  logo,
  cover: null,
  gallery: [],
  openJobs: 1,
}
const departments = [
  { id: 'd1', name: 'Kỹ thuật', count: 1 },
  { id: 'd2', name: 'Kinh doanh', count: 2 },
]
const envelope = (data: unknown, extra = {}) =>
  new Response(
    JSON.stringify({ success: true, statusCode: 200, message: 'Success', data, ...extra }),
  )

function stubApi({ withCompany = false } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (withCompany && url === `${API}/public/company`) return envelope(company)
    if (url === `${API}/public/jobs/departments`) return envelope(departments)
    if (url.startsWith(`${API}/public/jobs?`)) return envelope([job], { meta })
    if (url === `${API}/public/jobs/${job.id}`) return envelope(detail)
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const payloadOf = (script: string) =>
  JSON.parse(script.slice(`window.${PRERENDER_GLOBAL}=`.length)) as PrerenderPayload

afterEach(() => {
  vi.unstubAllGlobals()
  queryClient.clear()
  document.body.innerHTML = ''
})

describe('F-PUB-04: prerender trang công khai', () => {
  it('tạo HTML có nội dung, meta SEO và JSON-LD cho danh sách và từng job', async () => {
    stubApi()
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })

    expect(pages.map((p) => p.file)).toEqual(['jobs.html', `jobs/${job.id}.html`])
    const [list, page] = pages
    expect(list.html).toContain('Backend Developer (NestJS)')
    expect(list.head).toContain('<title>Việc làm đang tuyển – HireFlow Careers</title>')
    expect(list.html).toContain('Kinh doanh')
    expect(page.html).toContain('<h1')
    expect(page.html).toContain('Xây dựng API bằng NestJS')
    expect(page.head).toContain('"@type":"JobPosting"')
    expect(page.head).toContain(
      `<link rel="canonical" href="https://hireflow.example/jobs/${job.id}" />`,
    )
    expect(payloadOf(page.payload).queryState.queries).toHaveLength(1)
  })

  it('BR-JOB-07: trang dựng sẵn không lộ trọng số hay từ khoá', async () => {
    stubApi()
    const [, page] = await prerenderPublicPages({ apiUrl: API })
    expect(page.html + page.payload).not.toMatch(/weight|keywords/)
  })

  it('client hydrate khớp HTML dựng sẵn, không phải render lại từ đầu', async () => {
    stubApi()
    const [, page] = await prerenderPublicPages({ apiUrl: API })
    window.history.replaceState(null, '', `/jobs/${job.id}`)
    document.body.innerHTML = `<div id="root">${page.html}</div>`
    const container = document.getElementById('root')!
    const heading = container.querySelector('h1')

    hydrateQueryCache(payloadOf(page.payload))
    await resolveLazyRoutes(routes, window.location)
    const router = createAppRouter({ hydrationData: { loaderData: { [ROOT_ROUTE_ID]: null } } })
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <AppProviders>
            <RouterProvider router={router} />
          </AppProviders>
        </StrictMode>,
        { onRecoverableError },
      )
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector('h1')).toBe(heading)
    router.dispose()
  })

  it('F-PUB-06: dựng /careers khi hồ sơ công ty đã công khai; mọi trang có link "Về công ty"', async () => {
    stubApi({ withCompany: true })
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })

    expect(pages.map((p) => p.file)).toEqual(['jobs.html', `jobs/${job.id}.html`, 'careers.html'])
    const [list, detailPage, careers] = pages
    expect(careers.html).toContain('Công ty Cổ phần HireFlow')
    expect(careers.html).toContain('Bảo hiểm sức khoẻ')
    expect(careers.html).toContain('Backend Developer (NestJS)')
    expect(careers.head).toContain('<title>Công ty Cổ phần HireFlow – HireFlow Careers</title>')
    expect(careers.head).toContain(
      '<link rel="canonical" href="https://hireflow.example/careers" />',
    )
    for (const page of [list, detailPage]) expect(page.html).toContain('href="/careers"')
    expect(detailPage.html).toContain('Về Công ty Cổ phần HireFlow')
  })

  it('BR-ORG-01: hồ sơ chưa công khai thì không dựng /careers, các trang khác vẫn dựng', async () => {
    stubApi()
    const pages = await prerenderPublicPages({ apiUrl: API })
    expect(pages.map((p) => p.file)).toEqual(['jobs.html', `jobs/${job.id}.html`])
    expect(pages[1].html).not.toContain('href="/careers"')
  })

  it('client hydrate /careers khớp HTML dựng sẵn', async () => {
    stubApi({ withCompany: true })
    const careers = (await prerenderPublicPages({ apiUrl: API })).find(
      (p) => p.file === 'careers.html',
    )!
    window.history.replaceState(null, '', '/careers')
    document.body.innerHTML = `<div id="root">${careers.html}</div>`
    const container = document.getElementById('root')!
    const heading = container.querySelector('h1')

    hydrateQueryCache(payloadOf(careers.payload))
    await resolveLazyRoutes(routes, window.location)
    const router = createAppRouter({ hydrationData: { loaderData: { [ROOT_ROUTE_ID]: null } } })
    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(
        container,
        <StrictMode>
          <AppProviders>
            <RouterProvider router={router} />
          </AppProviders>
        </StrictMode>,
        { onRecoverableError },
      )
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.querySelector('h1')).toBe(heading)
    router.dispose()
  })

  it('E4: JSON-LD JobPosting có công ty tuyển, /careers có Organization', async () => {
    stubApi({ withCompany: true })
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })
    const ldOf = (head: string) =>
      JSON.parse(head.split('<script type="application/ld+json">')[1].split('</script>')[0])
    expect(ldOf(pages[1].head)).toMatchObject({
      '@type': 'JobPosting',
      hiringOrganization: { name: 'Công ty Cổ phần HireFlow' },
      employmentType: 'FULL_TIME',
      baseSalary: { currency: 'VND' },
    })
    expect(ldOf(pages[2].head)).toMatchObject({
      '@type': 'Organization',
      url: 'https://hireflow.example/careers',
    })
  })

  it('dữ liệu chứa "</script>" không làm kết thúc thẻ script sớm', async () => {
    const evil = '</script><script>alert(1)</script><!--'
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.startsWith(`${API}/public/jobs?`)) return envelope([job], { meta })
        if (url === `${API}/public/jobs/${job.id}`) return envelope({ ...detail, jdText: evil })
        if (url === `${API}/public/jobs/departments`) return envelope(departments)
        return new Response('{}', { status: 404 })
      }),
    )
    const [, page] = await prerenderPublicPages({ apiUrl: API })
    const scripts =
      (page.head + '<script>' + page.payload + '</script>').split('</script>').length - 1
    expect(scripts).toBe(2)
    expect(page.head).not.toContain('<script>alert')
    expect(page.payload).not.toContain('<!--')
    expect(payloadOf(page.payload).queryState.queries[0].state.data).toMatchObject({ jdText: evil })
  })

  it('E4: sitemap liệt kê đúng các trang đã dựng sẵn', () => {
    const xml = buildSitemap(
      [{ path: '/jobs' }, { path: `/jobs/${job.id}` }, { path: '/careers' }],
      'https://hireflow.example/',
    )
    expect(xml.match(/<loc>/g)).toHaveLength(3)
    expect(xml).toContain('<loc>https://hireflow.example/careers</loc>')
    expect(xml).toContain(`<loc>https://hireflow.example/jobs/${job.id}</loc>`)
  })
})
