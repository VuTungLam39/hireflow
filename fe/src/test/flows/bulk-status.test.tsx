import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { toast } from 'sonner'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { api, tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const signIn = (email: string) => {
  const me = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(me), tokenFor(me))
}

const open = (search = '') => {
  const router = createMemoryRouter([{ path: paths.applications, element: <ApplicationsPage /> }], {
    initialEntries: [`${paths.applications}${search}`],
  })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

const pick = async (rowLabel: string) => {
  const [box] = await screen.findAllByRole('checkbox', { name: `Chọn ${rowLabel}` })
  fireEvent.click(box)
}

const label = (id: string) => {
  const app = db.applications.find((a) => a.id === id)!
  const candidate = db.candidates.find((c) => c.id === app.candidateId)!
  const job = db.jobs.find((j) => j.id === app.jobId)!
  return `${candidate.fullName}, ${job.title}`
}

// F2 · BR-APP-12
describe('bulk status change', () => {
  it('rejects the selected applications with one shared reason in a single request', async () => {
    signIn('hr@hireflow.dev')
    const success = vi.spyOn(toast, 'success')
    const bodies: unknown[] = []
    server.events.on('request:start', async ({ request }) => {
      if (request.url.endsWith('/applications/bulk-status'))
        bodies.push(await request.clone().json())
    })
    open('?status=NEW&sortBy=createdAt&order=DESC')
    await screen.findByText(/hồ sơ khớp bộ lọc/)
    const ids = await waitFor(() => {
      const rows = screen.getAllByRole('checkbox', { name: /^Chọn (?!tất cả)/ })
      expect(rows.length).toBeGreaterThan(2)
      return db.applications.filter((a) => a.status === 'NEW').map((a) => a.id)
    })
    const chosen: string[] = []
    for (const id of ids) {
      if (chosen.length === 3) break
      if (screen.queryAllByRole('checkbox', { name: `Chọn ${label(id)}` }).length) {
        await pick(label(id))
        chosen.push(id)
      }
    }
    expect(chosen).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối 3 hồ sơ' }))
    const dialog = await screen.findByRole('dialog', { name: 'Từ chối 3 hồ sơ?' })
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'Chưa đủ kinh nghiệm' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối 3 hồ sơ' }))

    await waitFor(() => expect(success).toHaveBeenCalledWith('Đã từ chối 3 hồ sơ', undefined))
    expect(bodies).toEqual([
      {
        ids: expect.arrayContaining(chosen),
        status: 'REJECTED',
        reason: 'Chưa đủ kinh nghiệm',
      },
    ])
    expect((bodies[0] as { ids: string[] }).ids).toHaveLength(3)
    expect(
      chosen.every((id) => db.applications.find((a) => a.id === id)!.status === 'REJECTED'),
    ).toBe(true)
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Thao tác hàng loạt' })).not.toBeInTheDocument(),
    )
  })

  it('keeps skipped applications selected and says why', async () => {
    signIn('hr@hireflow.dev')
    const warning = vi.spyOn(toast, 'warning')
    open('?status=SCREENING&sortBy=createdAt&order=DESC')
    await screen.findByText(/hồ sơ khớp bộ lọc/)
    const [a, b] = db.applications.filter((x) => x.status === 'SCREENING').map((x) => x.id)
    server.use(
      http.post(api('/applications/bulk-status'), () =>
        HttpResponse.json({
          success: true,
          data: {
            succeeded: [a],
            unchanged: [],
            failed: [{ id: b, code: 'INVALID_STATUS_TRANSITION' }],
          },
        }),
      ),
    )
    await pick(label(a))
    await pick(label(b))

    fireEvent.click(screen.getByRole('button', { name: 'Chuyển 2 hồ sơ sang Phỏng vấn' }))

    await waitFor(() =>
      expect(warning).toHaveBeenCalledWith('Đã chuyển 1 hồ sơ sang “Phỏng vấn”', {
        description: expect.stringContaining('1 hồ sơ bỏ qua'),
      }),
    )
    const bar = await screen.findByRole('region', { name: 'Thao tác hàng loạt' })
    expect(within(bar).getByText('1')).toBeInTheDocument()
  })
})
