import { fireEvent, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { links, paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { jobHandlers } from '@/test/msw/handlers/jobs'
import { renderRoutes, signInAs } from '@/test/render'
import { useRankingDraft } from '../store'
import JobRankingPage from './JobRankingPage'

const server = setupServer(...authHandlers, ...jobHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const job = db.jobs.find((j) => j.departmentId === 'dep-eng' && j.requirements.length > 0)!

function renderAs(email: string) {
  signInAs(email)
  useRankingDraft.getState().reset(job.id)
  renderRoutes([{ path: paths.jobRanking, element: <JobRankingPage /> }], links.jobRanking(job.id))
}

// VF-03: ô chọn trọng số của tiêu chí 1, nhãn "1 NestJS · bắt buộc"
const weightSelect = () =>
  screen.findByRole('combobox', { name: new RegExp('^1\\s*' + job.requirements[0].label) })

// US-05 · BR-AI-05
describe('JobRankingPage', () => {
  it('BR-INT-02: an Interviewer gets the 403 page', async () => {
    renderAs('interviewer@hireflow.dev')

    expect(
      await screen.findByRole('heading', { name: 'Trang này không thuộc quyền của bạn' }),
    ).toBeInTheDocument()
  })

  it('lets HR save the new weights', async () => {
    renderAs('hr@hireflow.dev')
    const slider = await weightSelect()
    fireEvent.change(slider, { target: { value: job.requirements[0].weight === 3 ? 1 : 3 } })

    expect(screen.getByRole('button', { name: 'Lưu trọng số' })).toBeEnabled()
  })

  it('MVP 3.1 · BR-RANK-02: a Hiring Manager saves weights for themselves only', async () => {
    renderAs('hm.eng@hireflow.dev')
    const slider = await weightSelect()
    const next = job.requirements[0].weight === 3 ? 1 : 3
    fireEvent.change(slider, { target: { value: next } })

    expect(screen.queryByRole('button', { name: 'Lưu trọng số' })).not.toBeInTheDocument()
    const reset = screen.getByRole('button', { name: 'Về mặc định' })
    expect(reset).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu cho riêng tôi' }))

    const hm = db.users.find((u) => u.email === 'hm.eng@hireflow.dev')!
    await waitFor(() =>
      expect(db.rankingWeights[`${hm.id}:${job.id}`]?.weights[job.requirements[0].id]).toBe(next),
    )
    expect(job.requirements[0].weight).not.toBe(next)
    await waitFor(() => expect(reset).toBeDisabled())
  })
})

// Slice 9 · P5-D12
describe('ranking feedback', () => {
  it('VF-03 weight options carry words; VF-04 a re-order is announced', async () => {
    renderAs('hr@hireflow.dev')
    const select = await weightSelect()
    expect([...(select as HTMLSelectElement).options].map((o) => o.text)).toEqual([
      '1 · ít quan trọng',
      '2 · quan trọng',
      '3 · rất quan trọng',
    ])
    const status = () =>
      screen
        .getAllByRole('status')
        .map((s) => s.textContent)
        .join('|')
    const before = screen
      .getAllByRole('row')
      .map((r) => r.textContent)
      .join('|')
    expect(status()).not.toContain('Đã sắp xếp lại')
    for (const r of job.requirements) {
      const box = await screen.findByRole('combobox', { name: new RegExp(r.label) })
      fireEvent.change(box, { target: { value: r === job.requirements[0] ? 1 : 3 } })
    }
    await waitFor(() => {
      const after = screen
        .getAllByRole('row')
        .map((r) => r.textContent)
        .join('|')
      expect(after).not.toBe(before)
      expect(status()).toContain('Đã sắp xếp lại theo trọng số mới')
    })
  })

  it('P5-D12b: applications still scored on old criteria show a re-scoring notice', async () => {
    const app = db.applications.find((a) => a.jobId === job.id && a.aiStatus === 'DONE')!
    const saved = app.scoredJdVersion
    app.scoredJdVersion = job.jdVersion - 1
    renderAs('hr@hireflow.dev')
    expect(
      await screen.findByText(/Tiêu chí của tin vừa đổi — 1 hồ sơ đang được chấm lại/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument()
    app.scoredJdVersion = saved
  })
})
