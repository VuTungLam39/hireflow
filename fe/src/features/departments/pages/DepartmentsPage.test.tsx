import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'
import DepartmentsPage from './DepartmentsPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

const inUse = (id: string) =>
  db.users.some((u) => u.departmentId === id) || db.jobs.some((j) => j.departmentId === id)

// F-DEPT-01 · App Screens 7.8
describe('DepartmentsPage', () => {
  it('offers delete only for an empty department, from one row menu', async () => {
    const me = db.users.find((u) => u.email === 'admin@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(me), tokenFor(me))
    const router = createMemoryRouter([{ path: paths.departments, element: <DepartmentsPage /> }], {
      initialEntries: [paths.departments],
    })
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    const busy = db.departments.find((d) => inUse(d.id))!
    const [busyMenu] = await screen.findAllByRole(
      'button',
      { name: `Thao tác với ${busy.name}` },
      { timeout: 4000 },
    )
    expect(screen.queryByRole('button', { name: 'Xoá' })).not.toBeInTheDocument()
    fireEvent.click(busyMenu)
    const menu = screen.getByRole('menu', { name: `Thao tác với ${busy.name}` })
    expect(within(menu).getByRole('menuitem', { name: /Xoá phòng ban/ })).toBeDisabled()
    expect(within(menu).getByText(/chưa xoá được/)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    const empty = db.departments.find((d) => !inUse(d.id))
    if (!empty) return
    const [emptyMenu] = screen.getAllByRole('button', { name: `Thao tác với ${empty.name}` })
    fireEvent.click(emptyMenu)
    const emptyItems = screen.getByRole('menu', { name: `Thao tác với ${empty.name}` })
    expect(within(emptyItems).getByRole('menuitem', { name: /Xoá phòng ban/ })).toBeEnabled()
  })
})
