import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
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
})
