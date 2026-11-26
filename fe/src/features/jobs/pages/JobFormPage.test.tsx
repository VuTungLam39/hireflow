import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'
import JobFormPage from './JobFormPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

describe('JobFormPage', () => {
  // K-06
  it('keeps the job department selected once the department list arrives', async () => {
    const job = db.jobs[0]
    const row = db.users.find((u) => u.email === 'hr@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(row), tokenFor(row))
    const router = createMemoryRouter([{ path: paths.jobEdit, element: <JobFormPage /> }], {
      initialEntries: [paths.jobEdit.replace(':id', job.id)],
    })
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    const select = await screen.findByRole<HTMLSelectElement>(
      'combobox',
      { name: /Phòng ban/ },
      { timeout: 4000 },
    )
    await waitFor(() => expect(select.options.length).toBeGreaterThan(2), { timeout: 4000 })
    expect(select.value).toBe(job.departmentId)
  })
})

describe('JobFormPage — tạo tin', () => {
  // K-03
  it('shows the candidate preview as a named region, not a complementary landmark', async () => {
    const row = db.users.find((u) => u.email === 'hr@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(row), tokenFor(row))
    const router = createMemoryRouter([{ path: paths.jobNew, element: <JobFormPage /> }], {
      initialEntries: [paths.jobNew],
    })
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('region', { name: 'Ứng viên sẽ thấy' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
