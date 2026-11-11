import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { toast } from 'sonner'
import { shiftIsoDay, todayIsoDay } from '@/lib/vn-day'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types/user'
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

  describe('clone a job (F4)', () => {
    const openAs = (email: string, search: string) => {
      const row = db.users.find((u) => u.email === email)!
      useAuthStore.getState().setSession(toUser(row), tokenFor(row))
      const router = createMemoryRouter([{ path: paths.jobs, element: <JobsPage /> }], {
        initialEntries: [`${paths.jobs}${search}`],
      })
      render(
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <RouterProvider router={router} />
        </QueryClientProvider>,
      )
      return router
    }

    it('creates a draft copy from the row menu and opens it on the content tab', async () => {
      const src = db.jobs.find((j) => j.status === 'CLOSED')!
      const success = vi.spyOn(toast, 'success')
      const router = openAs('hr@hireflow.dev', '?status=CLOSED')
      const [menu] = await screen.findAllByRole('button', { name: `Thao tác với ${src.title}` })
      fireEvent.click(menu)
      fireEvent.click(
        within(await screen.findByRole('menu')).getByRole('menuitem', {
          name: 'Nhân bản thành tin nháp',
        }),
      )

      await waitFor(() =>
        expect(success).toHaveBeenCalledWith(`Đã tạo bản nháp “${src.title} (bản sao)”`),
      )
      const copy = db.jobs.at(-1)!
      onTestFinished(() => {
        db.jobs.splice(db.jobs.indexOf(copy), 1)
      })
      expect(copy).toMatchObject({
        title: `${src.title} (bản sao)`,
        status: 'DRAFT',
        jdText: src.jdText,
        jdVersion: 1,
        deadline: null,
        publishedAt: null,
      })
      expect(copy.requirements.map((r) => r.label)).toEqual(src.requirements.map((r) => r.label))
      expect(router.state.location.search).toContain(`xem=job%3A${copy.id}%3Acontent`)
    })

    it('hides the action from hiring managers, who cannot create jobs', async () => {
      const hm = db.users.find((u) => u.role === Role.HiringManager && u.departmentId)!
      const own = db.jobs.find((j) => j.departmentId === hm.departmentId)!
      openAs(hm.email, `?status=${own.status}`)
      const [menu] = await screen.findAllByRole('button', { name: `Thao tác với ${own.title}` })
      fireEvent.click(menu)
      const list = await screen.findByRole('menu')
      expect(
        within(list).queryByRole('menuitem', { name: 'Nhân bản thành tin nháp' }),
      ).not.toBeInTheDocument()
    })
  })
})
