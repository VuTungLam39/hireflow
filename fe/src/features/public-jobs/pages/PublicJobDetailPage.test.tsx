import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { formatSalary, salaryOf } from '@/features/jobs'
import { shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import PublicJobDetailPage from './PublicJobDetailPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// F-PUB-02, F-PUB-03
describe('PublicJobDetailPage', () => {
  it('offers a pinned apply button that jumps to the form, and dates the post like the list', async () => {
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const router = createMemoryRouter(
      [{ path: paths.publicJobDetail, element: <PublicJobDetailPage /> }],
      { initialEntries: [links.publicJobDetail(job.id)] },
    )
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    await screen.findByRole('heading', { level: 1, name: job.title })
    const posted = document.querySelector('time')!
    expect(posted).toHaveAttribute('dateTime', job.publishedAt)
    expect(posted.textContent).toMatch(/hôm nay|hôm qua|trước$/)

    const cta = screen.getByRole('link', { name: 'Ứng tuyển vị trí này' })
    expect(cta).toHaveAttribute('href', '#ung-tuyen')
    fireEvent.click(cta)
    expect(document.activeElement).toBe(screen.getByLabelText('Họ tên'))
  })

  const open = (id: string) => {
    const router = createMemoryRouter(
      [{ path: paths.publicJobDetail, element: <PublicJobDetailPage /> }],
      { initialEntries: [links.publicJobDetail(id)] },
    )
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
  }

  it('F-JOB-10, F-JOB-11: shows salary, level, mode and benefits; a hidden salary is not shown at all', async () => {
    const shown = db.jobs.find((j) => j.status === 'OPEN' && j.salaryVisibility === 'RANGE')!
    open(shown.id)
    await screen.findByRole('heading', { level: 1, name: shown.title })
    const facts = screen.getByText('Mức lương').closest('dl')!
    expect(facts).toHaveTextContent(formatSalary(salaryOf(shown))!)
    expect(facts).toHaveTextContent(`${shown.headcount} người`)
    expect(screen.getByRole('heading', { name: 'Quyền lợi' })).toBeInTheDocument()
    expect(screen.getByText('Lương tháng 13').tagName).toBe('LI')
    cleanup()

    const hidden = db.jobs.find((j) => j.status === 'OPEN' && j.salaryVisibility === 'HIDDEN')
    if (!hidden) return
    open(hidden.id)
    await screen.findByRole('heading', { level: 1, name: hidden.title })
    expect(screen.queryByText('Mức lương')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('triệu')
  })

  it('BR-JOB-10: an expired job still opens, explains why and offers no application form', async () => {
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const saved = job.deadline
    job.deadline = shiftIsoDay(todayIsoDay(), -1)
    onTestFinished(() => {
      job.deadline = saved
    })
    open(job.id)
    expect(
      await screen.findByRole('heading', { name: 'Đã hết hạn nhận hồ sơ' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Họ tên')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ứng tuyển vị trí này' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem vị trí đang tuyển' })).toHaveAttribute(
      'href',
      paths.publicJobs,
    )
  })
})
