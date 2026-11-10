import { fireEvent, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { renderRouteAs } from '@/test/render'
import UsersPage from './UsersPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

function renderAsAdmin() {
  return renderRouteAs(
    'admin@hireflow.dev',
    [{ path: paths.users, element: <UsersPage /> }],
    paths.users,
  ).user
}

// F-USER-03 → 05 · BR-ACC-05 · App Screens 7.6
describe('UsersPage', () => {
  it('keeps active accounts neutral and groups row actions in one menu', async () => {
    const me = renderAsAdmin()
    const other = db.users.find((u) => u.id !== me.id && u.isActive)!

    const [active] = await screen.findAllByText('Hoạt động', undefined, { timeout: 4000 })
    expect(active).not.toHaveClass('text-good-ink')
    expect(screen.queryByRole('button', { name: 'Xoá' })).not.toBeInTheDocument()

    const [menu] = screen.getAllByRole('button', { name: `Thao tác với ${other.fullName}` })
    fireEvent.click(menu)
    const items = screen.getByRole('menu', { name: `Thao tác với ${other.fullName}` })
    expect(within(items).getByRole('menuitem', { name: /Khoá tài khoản/ })).toBeEnabled()
    expect(within(items).getByRole('menuitem', { name: /Xoá người dùng/ })).toBeEnabled()
  })

  it('cannot lock or delete your own account (BR-ACC-05)', async () => {
    const me = renderAsAdmin()
    const [menu] = await screen.findAllByRole(
      'button',
      { name: `Thao tác với ${me.fullName}` },
      { timeout: 4000 },
    )
    fireEvent.click(menu)
    const items = screen.getByRole('menu', { name: `Thao tác với ${me.fullName}` })
    expect(within(items).getByRole('menuitem', { name: /Khoá tài khoản/ })).toBeDisabled()
    expect(within(items).getByRole('menuitem', { name: /Xoá người dùng/ })).toBeDisabled()
    expect(within(items).getByText(/không thể tự khoá hoặc xoá/)).toBeInTheDocument()
  })
})
