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

const open = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: paths.careers, element: <CareersPage /> },
      { path: paths.publicJobDetail, element: <PublicJobDetailPage /> },
      { path: paths.publicJobs, element: <p>Danh sách việc làm</p> },
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
    open(paths.careers)
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
    open(paths.careers)

    await screen.findByRole('heading', { level: 1, name: companyState.profile.name })
    expect(screen.getByRole('img', { name: `Logo ${companyState.profile.name}` })).toBeVisible()
    expect(screen.getByText(`${openJobs} vị trí`)).toHaveAttribute('href', paths.publicJobs)
    expect(screen.getByText('Bảo hiểm sức khoẻ')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Chặng đường phát triển' })).toBeVisible()

    const map = screen.getByRole('link', { name: /Xem bản đồ/ })
    expect(map).toHaveAttribute('target', '_blank')
    expect(map).toHaveAttribute('rel', 'noopener noreferrer')

    const jobs = within(
      screen.getByRole('heading', { name: 'Vị trí đang tuyển' }).closest('section')!,
    )
    await jobs.findAllByRole('link', { name: /·/ })
    expect(jobs.getAllByRole('link', { name: /·/ }).length).toBeLessThanOrEqual(5)
    expect(jobs.getByRole('link', { name: `Xem tất cả ${openJobs} vị trí` })).toBeVisible()
  })

  it('opens the gallery in a lightbox that the arrow keys move through', async () => {
    publish()
    open(paths.careers)

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

  it('links to /careers once the profile is published', async () => {
    publish()
    open(links.publicJobDetail(job().id))
    const about = await screen.findByRole('heading', { name: `Về ${companyState.profile.name}` })
    expect(within(about.closest('section')!).getByRole('link')).toHaveAttribute(
      'href',
      paths.careers,
    )
  })

  it('is hidden while the profile is not published', async () => {
    open(links.publicJobDetail(job().id))
    await screen.findByRole('heading', { level: 1, name: job().title })
    expect(screen.queryByRole('link', { name: /Tìm hiểu về công ty/ })).not.toBeInTheDocument()
  })
})
