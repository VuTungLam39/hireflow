import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { CompanyMedia, MediaKind } from '@/features/company'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { companyState } from '@/test/msw/handlers/company'
import CareersPage from './CareersPage'
import PublicJobDetailPage from './PublicJobDetailPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
beforeEach(() => {
  companyState.media = []
})

const media = (kind: MediaKind, position: number, alt: string): CompanyMedia => ({
  id: `${kind}-${position}`,
  kind,
  url: `/public/media/${String(position).padStart(64, kind === 'LOGO' ? 'a' : 'b')}.png`,
  width: 1200,
  height: 800,
  alt,
  position,
})

const publish = () => {
  companyState.profile.offices = [
    { name: 'Hà Nội', address: '18 Duy Tân, Cầu Giấy', mapUrl: 'https://maps.google.com/?q=x' },
  ]
  companyState.media = [
    media('LOGO', 0, 'Logo'),
    media('COVER', 0, 'Ảnh bìa'),
    media('GALLERY', 0, 'Khu làm việc mở'),
    media('GALLERY', 1, 'Phòng họp nhóm'),
    media('GALLERY', 2, 'Góc nghỉ'),
  ]
}

const DEMO = links.publicCompany('hireflow-demo')

const open = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: paths.publicCompany, element: <CareersPage /> },
      { path: paths.publicJobDetail, element: <PublicJobDetailPage /> },
      { path: paths.publicJobs, element: <p>Danh sách việc làm</p> },
      { path: paths.publicCompanies, element: <p>Danh bạ công ty</p> },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// F-PUB-06 · BR-ORG-01 · Mở rộng MVP 2 – E3
describe('CareersPage', () => {
  it('BR-ORG-01: an unpublished profile shows a calm notice that points to open jobs', async () => {
    open(DEMO)
    await screen.findByText('Trang giới thiệu công ty đang được cập nhật')
    expect(screen.getByRole('link', { name: 'Xem vị trí đang tuyển' })).toHaveAttribute(
      'href',
      paths.publicJobs,
    )
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('shows the profile: facts, benefits, history, offices and the latest open jobs', async () => {
    publish()
    const openJobs = db.jobs.filter((j) => j.status === 'OPEN').length
    open(DEMO)

    await screen.findByRole('heading', { level: 1, name: companyState.profile.name })
    expect(screen.getByRole('img', { name: `Logo ${companyState.profile.name}` })).toBeVisible()
    expect(screen.getByText(`${openJobs} vị trí`)).toHaveAttribute(
      'href',
      `${paths.publicJobs}?company=hireflow-demo`,
    )
    expect(screen.getByText('Bảo hiểm sức khoẻ')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Chặng đường phát triển' })).toBeVisible()

    const map = screen.getByRole('link', { name: /Xem bản đồ/ })
    expect(map).toHaveAttribute('target', '_blank')
    expect(map).toHaveAttribute('rel', 'noopener noreferrer')

    const jobs = within(
      screen.getByRole('heading', { name: 'Vị trí đang tuyển' }).closest('section')!,
    )
    // US-23: toàn bộ tin đang tuyển của công ty
    expect(jobs.getAllByRole('link', { name: /·/ })).toHaveLength(openJobs)
    expect(jobs.queryByRole('link', { name: /Xem tất cả/ })).toBeNull()
  })

  it('US-23: an unknown company explains it and links to the directory', async () => {
    open(links.publicCompany('khong-ton-tai'))
    await screen.findByText('Không tìm thấy công ty này')
    expect(screen.getByRole('link', { name: 'Xem các công ty' })).toHaveAttribute(
      'href',
      paths.publicCompanies,
    )
  })

  it('opens the gallery in a lightbox that the arrow keys move through', async () => {
    publish()
    open(DEMO)

    fireEvent.click(await screen.findByRole('button', { name: 'Xem ảnh lớn: Phòng họp nhóm' }))
    const dialog = screen.getByRole('dialog', { name: 'Thư viện ảnh' })
    expect(within(dialog).getByText('Ảnh 2 / 3')).toBeVisible()

    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(within(dialog).getByText('Ảnh 3 / 3')).toBeVisible()
    expect(within(dialog).getByRole('img', { name: 'Góc nghỉ' })).toBeVisible()

    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(within(dialog).getByText('Ảnh 1 / 3')).toBeVisible()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Ảnh trước' }))
    expect(within(dialog).getByText('Ảnh 3 / 3')).toBeVisible()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng' }))
    expect(screen.queryByText('Ảnh 3 / 3')).not.toBeInTheDocument()
  })
})

// F-PUB-06: khối "Về công ty" trên chi tiết tin
describe('PublicJobDetailPage – about the company', () => {
  const job = () => db.jobs.find((j) => j.status === 'OPEN')!

  // US-24
  it('links the company block and the company name to the company page', async () => {
    publish()
    open(links.publicJobDetail(job().id))
    const about = await screen.findByRole('heading', { name: `Về ${companyState.profile.name}` })
    expect(within(about.closest('section')!).getByRole('link')).toHaveAttribute('href', DEMO)
    expect(screen.getByRole('link', { name: companyState.profile.name })).toHaveAttribute(
      'href',
      DEMO,
    )
  })

  it('lists up to 4 other open jobs of the company, not the one being read', async () => {
    open(links.publicJobDetail(job().id))
    const heading = await screen.findByRole('heading', {
      name: `Tin khác của ${companyState.profile.name}`,
    })
    const links_ = within(heading.closest('section')!).getAllByRole('link')
    expect(links_.length).toBeGreaterThan(0)
    expect(links_.length).toBeLessThanOrEqual(4)
    expect(links_.map((l) => l.getAttribute('href'))).not.toContain(links.publicJobDetail(job().id))
  })
})
