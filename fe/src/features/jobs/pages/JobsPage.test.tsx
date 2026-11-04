import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'
import JobsPage from './JobsPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// F-JOB-01 · BR-JOB-10
describe('JobsPage', () => {
  it('flags an open job past its deadline so HR knows which one to close', async () => {
    const job = db.jobs.find((j) => j.status === 'OPEN')!
    const saved = job.deadline
    job.deadline = shiftIsoDay(todayIsoDay(), -2)
    onTestFinished(() => {
      job.deadline = saved
    })
    const row = db.users.find((u) => u.email === 'hr@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(row), tokenFor(row))
    const router = createMemoryRouter([{ path: paths.jobs, element: <JobsPage /> }], {
      initialEntries: [`${paths.jobs}?status=OPEN`],
    })
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    const tags = await screen.findAllByText(
      'Hết hạn nộp · đã ẩn khỏi trang tuyển dụng',
      undefined,
      {
        timeout: 4000,
      },
    )
    // một nhãn ở bảng (desktop), một ở thẻ (mobile)
    expect(tags.length).toBeGreaterThanOrEqual(1)
    expect(tags[0]).toHaveAttribute('title', expect.stringMatching(/^Hạn nộp \d{2}\/\d{2}\/\d{4}$/))
  })
})
