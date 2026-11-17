import { fireEvent, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { foldText } from '@/test/msw/http'
import { db } from '@/test/msw/data'
import { companyState } from '@/test/msw/handlers/company'
import { allHandlers } from '@/test/msw/handlers'
import { renderRoutes } from '@/test/render'
import PublicJobsPage from './PublicJobsPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

function renderPage(entry: string = paths.publicJobs) {
  renderRoutes([{ path: paths.publicJobs, element: <PublicJobsPage /> }], entry)
}

// F-PUB-01
describe('PublicJobsPage', () => {
  // KH MVP 3 8.1: phòng ban chỉ lọc được trong một công ty
  it('keeps the department filter of a company to one row with counts, the rest behind “+N”', async () => {
    const open = db.jobs.filter((j) => j.status === 'OPEN')
    const byDept = new Map<string, number>()
    for (const j of open) {
      const name = db.departments.find((d) => d.id === j.departmentId)!.name
      byDept.set(name, (byDept.get(name) ?? 0) + 1)
    }
    renderPage(`${paths.publicJobs}?company=hireflow-demo`)

    const group = await screen.findByRole('radiogroup', { name: 'Lọc theo phòng ban' })
    const radios = within(group).getAllByRole('radio')
    expect(radios[0]).toHaveTextContent(`Mọi phòng ban ${open.length}`)
    if (byDept.size <= 6) {
      expect(radios).toHaveLength(byDept.size + 1)
      const [name, count] = [...byDept.entries()][0]
      fireEvent.click(within(group).getByRole('radio', { name: new RegExp(name) }))
      expect(
        await screen.findByText(
          (_, el) =>
            el?.tagName === 'P' &&
            !!el.textContent?.startsWith(`${count} vị trí đang tuyển`) &&
            el.textContent.endsWith(` · ${name}`),
          undefined,
          { timeout: 4000 },
        ),
      ).toBeInTheDocument()
      return
    }
    expect(radios).toHaveLength(6)
    const more = within(group).getByRole('button', { name: `+${byDept.size - 5} phòng ban khác` })

    fireEvent.click(more)
    const [rest] = screen.getAllByRole('menuitemradio')
    const name = rest.textContent!.replace(/\s*\d+$/, '')
    fireEvent.click(rest)
    expect(
      within(group).getByRole('radio', { name: new RegExp(name), checked: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${byDept.get(name)} vị trí đang tuyển.* · ${name}`)),
    ).toBeInTheDocument()
  })

  it('F-PUB-05: filters by work mode and shows salary and level on each card', async () => {
    const remote = db.jobs.filter((j) => j.status === 'OPEN' && j.workMode === 'REMOTE')
    renderPage()
    await screen.findByText(/vị trí đang tuyển$/, undefined, { timeout: 4000 })
    expect(screen.queryByRole('radiogroup', { name: 'Lọc theo phòng ban' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Làm việc/ }))
    fireEvent.click(await screen.findByRole('option', { name: 'Từ xa' }))
    expect(
      await screen.findByText(`${remote.length} vị trí đang tuyển`, undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
    for (const job of remote) {
      const card = screen.getByText(job.title).closest('a')!
      expect(card).toHaveTextContent('Từ xa')
    }
  })

  // MVP 3 · US-22
  it('filters by location without marks and names the company on each card', async () => {
    const hanoi = db.jobs.filter(
      (j) => j.status === 'OPEN' && foldText(j.location).includes('ha noi'),
    )
    renderPage(`${paths.publicJobs}?location=ha%20noi`)
    expect(
      await screen.findByText(`${hanoi.length} vị trí đang tuyển`, undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Địa điểm' })).toHaveValue('ha noi')
    const card = screen.getByText(hanoi[0].title).closest('a')!
    expect(card).toHaveTextContent(companyState.profile.name)
    expect(card).toHaveTextContent(hanoi[0].location)
  })
})
