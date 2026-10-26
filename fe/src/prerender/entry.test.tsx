import { act, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/providers'
import { queryClient } from '@/lib/query-client'
import { createAppRouter, ROOT_ROUTE_ID, routes } from '@/routes/router'
import { prerenderPublicPages } from './entry'
import { hydrateQueryCache, resolveLazyRoutes } from './hydrate'
import { PRERENDER_GLOBAL, type PrerenderPayload } from './shared'

const API = 'http://api.test/api/v1'
const job = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Backend Developer (NestJS)',
  location: 'Hà Nội',
  department: { name: 'Kỹ thuật' },
  publishedAt: '2026-10-20T02:00:00.000Z',
}
const detail = {
  ...job,
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
const envelope = (data: unknown, extra = {}) =>
  new Response(
    JSON.stringify({ success: true, statusCode: 200, message: 'Success', data, ...extra }),
  )

function stubApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
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
})
