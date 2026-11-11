import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import JobRankingPage from '@/features/ranking/pages/JobRankingPage'
import { useRankingDraft } from '@/features/ranking/store'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { renderRouteAs } from '@/test/render'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const job = db.jobs.find(
  (j) =>
    j.requirements.length > 0 &&
    db.applications.filter((a) => a.jobId === j.id && a.aiStatus === 'DONE').length >= 3,
)!
const scored = db.applications.filter((a) => a.jobId === job.id && a.aiStatus === 'DONE')
const nameOf = (id: string) =>
  db.candidates.find((c) => c.id === db.applications.find((x) => x.id === id)!.candidateId)!
    .fullName

// F3 · BR-APP-13
describe('compare candidates', () => {
  it('opens from the bulk bar when 2 applications of the same job are selected', async () => {
    renderRouteAs(
      'hr@hireflow.dev',
      [{ path: paths.applications, element: <ApplicationsPage /> }],
      `${paths.applications}?jobId=${job.id}&sortBy=createdAt&order=DESC`,
    )
    const [first, second] = scored
    for (const { id } of [first, second]) {
      const [box] = await screen.findAllByRole(
        'checkbox',
        { name: `Chọn ${nameOf(id)}, ${job.title}` },
        { timeout: 4000 },
      )
      fireEvent.click(box)
    }

    fireEvent.click(screen.getByRole('button', { name: 'So sánh 2 hồ sơ' }))
    const dialog = await screen.findByRole('dialog', { name: 'So sánh 2 ứng viên' })
    expect(await within(dialog).findByRole('tab', { name: nameOf(second.id) })).toBeVisible()
  })

  it('collects up to 3 people in a tray on the ranking screen', async () => {
    useRankingDraft.getState().reset(job.id)
    renderRouteAs(
      'hr@hireflow.dev',
      [{ path: paths.jobRanking, element: <JobRankingPage /> }],
      links.jobRanking(job.id),
    )
    const add = async (id: string) => {
      fireEvent.click((await screen.findAllByText(nameOf(id), undefined, { timeout: 4000 }))[0])
      const panel = await screen.findByRole('dialog', { name: new RegExp(`Vì sao ${nameOf(id)}`) })
      fireEvent.click(within(panel).getByRole('button', { name: 'Thêm vào so sánh' }))
      expect(within(panel).getByRole('button', { name: 'Bỏ khỏi so sánh' })).toBeVisible()
    }
    await add(scored[0].id)
    const tray = screen.getByRole('region', { name: 'Khay so sánh' })
    expect(within(tray).getByRole('button', { name: 'So sánh' })).toBeDisabled()

    await add(scored[1].id)
    await waitFor(() => expect(within(tray).getByText('So sánh 2/3')).toBeInTheDocument())
    fireEvent.click(
      within(tray).getByRole('button', { name: `Bỏ ${nameOf(scored[1].id)} khỏi so sánh` }),
    )
    expect(within(tray).getByText('So sánh 1/3')).toBeInTheDocument()

    await add(scored[2].id)
    fireEvent.click(within(tray).getByRole('button', { name: 'So sánh' }))
    expect(await screen.findByRole('dialog', { name: 'So sánh 2 ứng viên' })).toBeInTheDocument()
  })
})
