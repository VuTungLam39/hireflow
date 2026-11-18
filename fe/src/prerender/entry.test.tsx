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
const LOGO_URL = `/public/media/${'a'.repeat(64)}.png`
const SLUG = 'hireflow-demo'
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
  company: {
    name: 'Công ty Cổ phần HireFlow',
    slug: SLUG,
    logoUrl: LOGO_URL,
    tagline: 'Đọc kỹ từng hồ sơ',
  },
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
  otherJobs: [],
}
const meta = (totalItems = 1, limit = 12) => ({
  page: 1,
  limit,
  totalItems,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
})
const logo = {
  id: 'm1',
  kind: 'LOGO',
  url: LOGO_URL,
  width: 256,
  height: 256,
  alt: 'Logo',
  position: 0,
}
const company = {
  slug: SLUG,
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
  jobs: [job],
}
const card = {
  slug: SLUG,
  name: company.name,
  logoUrl: LOGO_URL,
  tagline: company.tagline,
  industries: company.industries,
  openJobs: 1,
}
const envelope = (data: unknown, extra = {}) =>
  new Response(
    JSON.stringify({ success: true, statusCode: 200, message: 'Success', data, ...extra }),
  )

function stubApi({ withCompany = false, jobDetail = detail as object } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.startsWith(`${API}/public/companies?`)) {
      return withCompany
        ? envelope([card], { meta: meta(1, 48) })
        : envelope([], { meta: meta(0, 48) })
    }
    if (withCompany && url === `${API}/public/companies/${SLUG}`) return envelope(company)
    if (url.startsWith(`${API}/public/jobs?`)) return envelope([job], { meta: meta() })
    if (url === `${API}/public/jobs/${job.id}`) return envelope(jobDetail)
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const payloadOf = (script: string) =>
  JSON.parse(script.slice(`window.${PRERENDER_GLOBAL}=`.length)) as PrerenderPayload

async function expectHydrates(page: { html: string; payload: string }, path: string) {
  window.history.replaceState(null, '', path)
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
}

const ldOf = (head: string) =>
  JSON.parse(head.split('<script type="application/ld+json">')[1].split('</script>')[0])

afterEach(() => {
  vi.unstubAllGlobals()
  queryClient.clear()
  document.body.innerHTML = ''
})

describe('F-PUB-04: prerender trang công khai', () => {
  it('tạo HTML có nội dung, meta SEO và JSON-LD cho danh sách và từng job', async () => {
    stubApi()
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })

    expect(pages.map((p) => p.file)).toEqual([
      'jobs.html',
      `jobs/${job.id}.html`,
      'companies.html',
      'chinh-sach-du-lieu.html',
    ])
    const [list, page, , privacy] = pages
    expect(privacy.html).toContain('Chính sách dữ liệu ứng viên')
    expect(privacy.html).toContain('wdonglin39@gmail.com')
    expect(privacy.html).toContain('Bản demo thực tập')
    expect(list.html).toContain('Backend Developer (NestJS)')
    expect(list.html).toContain('Công ty Cổ phần HireFlow')
    expect(list.head).toContain('<title>Việc làm đang tuyển – HireFlow Careers</title>')
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

  it('client hydrate trang tin khớp HTML dựng sẵn, không phải render lại từ đầu', async () => {
    stubApi()
    const [, page] = await prerenderPublicPages({ apiUrl: API })
    await expectHydrates(page, `/jobs/${job.id}`)
  })

  // MVP 3 · KH 9.6 · US-23, US-24
  it('dựng /companies và mọi trang công ty; tin có khối công ty và og:image của công ty', async () => {
    stubApi({ withCompany: true })
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })

    expect(pages.map((p) => p.file)).toEqual([
      'jobs.html',
      `jobs/${job.id}.html`,
      'companies.html',
      `companies/${SLUG}.html`,
      'chinh-sach-du-lieu.html',
    ])
    const [list, detailPage, directory, companyPage] = pages
    expect(directory.html).toContain('Công ty Cổ phần HireFlow')
    expect(directory.head).toContain('<title>Công ty đang tuyển – HireFlow Careers</title>')
    expect(companyPage.html).toContain('Bảo hiểm sức khoẻ')
    expect(companyPage.html).toContain('Backend Developer (NestJS)')
    expect(companyPage.head).toContain('<title>Công ty Cổ phần HireFlow – HireFlow Careers</title>')
    expect(companyPage.head).toContain(
      `<link rel="canonical" href="https://hireflow.example/companies/${SLUG}" />`,
    )
    for (const page of [list, detailPage]) expect(page.html).toContain('href="/companies"')
    expect(detailPage.html).toContain('Về Công ty Cổ phần HireFlow')
    expect(detailPage.html).toContain(`href="/companies/${SLUG}"`)
    expect(detailPage.head).toMatch(
      /<meta property="og:image" content="https:\/\/hireflow\.example\/[^"]*\/public\/media\/a{64}\.png" \/>/,
    )
  })

  it('client hydrate /companies và trang công ty khớp HTML dựng sẵn', async () => {
    stubApi({ withCompany: true })
    const pages = await prerenderPublicPages({ apiUrl: API })
    await expectHydrates(
      pages.find((p) => p.file === 'companies.html')!,
      '/companies',
    )
    queryClient.clear()
    document.body.innerHTML = ''
    await expectHydrates(
      pages.find((p) => p.file === `companies/${SLUG}.html`)!,
      `/companies/${SLUG}`,
    )
  })

  it('E4: JSON-LD JobPosting có đúng công ty đăng tin, trang công ty có Organization', async () => {
    stubApi({ withCompany: true })
    const pages = await prerenderPublicPages({ apiUrl: API, siteUrl: 'https://hireflow.example' })
    expect(ldOf(pages[1].head)).toMatchObject({
      '@type': 'JobPosting',
      hiringOrganization: {
        name: 'Công ty Cổ phần HireFlow',
        url: `https://hireflow.example/companies/${SLUG}`,
      },
      employmentType: 'FULL_TIME',
      baseSalary: { currency: 'VND' },
    })
    expect(ldOf(pages[3].head)).toMatchObject({
      '@type': 'Organization',
      url: `https://hireflow.example/companies/${SLUG}`,
    })
  })

  it('dữ liệu chứa "</script>" không làm kết thúc thẻ script sớm', async () => {
    const evil = '</script><script>alert(1)</script><!--'
    stubApi({ jobDetail: { ...detail, jdText: evil } })
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
      [
        { path: '/jobs' },
        { path: `/jobs/${job.id}` },
        { path: '/companies' },
        { path: `/companies/${SLUG}` },
      ],
      'https://hireflow.example/',
    )
    expect(xml.match(/<loc>/g)).toHaveLength(4)
    expect(xml).toContain(`<loc>https://hireflow.example/companies/${SLUG}</loc>`)
    expect(xml).toContain(`<loc>https://hireflow.example/jobs/${job.id}</loc>`)
  })
})
