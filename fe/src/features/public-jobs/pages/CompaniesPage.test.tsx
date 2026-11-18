import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import type { CompanyMedia } from '@/features/company'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { companyState } from '@/test/msw/handlers/company'
import { renderRoutes } from '@/test/render'
import CompaniesPage from './CompaniesPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

const logo: CompanyMedia = {
  id: 'logo',
  kind: 'LOGO',
  url: `/public/media/${'a'.repeat(64)}.png`,
  width: 256,
  height: 256,
  alt: 'Logo',
  position: 0,
}

// MVP 3 · F-PUB-10, US-23
describe('CompaniesPage', () => {
  it('lists companies with their open jobs and links to each company page', async () => {
    companyState.media = [logo]
    const open = db.jobs.filter((j) => j.status === 'OPEN').length
    renderRoutes(
      [{ path: paths.publicCompanies, element: <CompaniesPage /> }],
      paths.publicCompanies,
    )

    const demo = await screen.findByRole('link', { name: new RegExp(companyState.profile.name) })
    expect(demo).toHaveAttribute('href', links.publicCompany('hireflow-demo'))
    expect(within(demo).getByText(`${open} vị trí đang tuyển`)).toBeInTheDocument()
    const other = screen.getByRole('link', { name: /Ví Mây/ })
    expect(within(other).getByText('Chưa có vị trí đang tuyển')).toBeInTheDocument()
  })

  it('searches by name without marks and explains an empty result', async () => {
    const user = userEvent.setup()
    renderRoutes(
      [{ path: paths.publicCompanies, element: <CompaniesPage /> }],
      paths.publicCompanies,
    )
    await screen.findByRole('link', { name: /Ví Mây/ })

    await user.type(screen.getByRole('searchbox', { name: 'Tìm công ty' }), 'vi may')
    await vi.waitFor(() =>
      expect(
        screen.queryByRole('link', { name: new RegExp(companyState.profile.name) }),
      ).toBeNull(),
    )
    expect(screen.getByRole('link', { name: /Ví Mây/ })).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Tìm công ty' }))
    await user.type(screen.getByRole('searchbox', { name: 'Tìm công ty' }), 'khong co')
    expect(await screen.findByText('Chưa có công ty khớp “khong co”')).toBeInTheDocument()
  })
})
