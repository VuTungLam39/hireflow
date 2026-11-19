import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { toJob } from '@/test/msw/http'
import { renderRouteAs } from '@/test/render'
import { InterviewStagesEditor } from './InterviewStagesEditor'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  db.interviewStages = []
})
afterAll(() => server.close())

const openJob = () => db.jobs.find((j) => j.status === 'OPEN' && j.requirements.length > 1)!
const renderEditor = (canEdit = true) => {
  const job = toJob(openJob())
  renderRouteAs(
    'hr@hireflow.dev',
    [{ path: '/', element: <InterviewStagesEditor job={job} canEdit={canEdit} /> }],
    '/',
  )
  return job
}

// MVP 3.1 · F-INT-04, BR-INT-05
describe('InterviewStagesEditor', () => {
  it('adds a stage with a criterion picked from the job criteria and saves it', async () => {
    const job = renderEditor()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Thêm vòng' }))
    const stage = screen.getByRole('listitem', { name: 'Vòng 1' })

    await user.click(screen.getByRole('button', { name: 'Lưu vòng phỏng vấn' }))
    expect(within(stage).getByRole('alert')).toHaveTextContent('Tên vòng cần ít nhất 2 ký tự')

    await user.type(within(stage).getByLabelText('Tên vòng 1'), 'Vòng kỹ thuật')
    await user.click(within(stage).getByRole('button', { name: job.requirements[0].label }))
    await user.click(screen.getByRole('button', { name: 'Lưu vòng phỏng vấn' }))

    await waitFor(() => expect(db.interviewStages).toHaveLength(1))
    expect(db.interviewStages).toEqual([
      expect.objectContaining({
        jobId: job.id,
        position: 1,
        name: 'Vòng kỹ thuật',
        criteria: [{ id: expect.any(String), label: job.requirements[0].label }],
      }),
    ])
  })

  it('a stage with feedback is locked: no delete, no criterion changes, names still editable', async () => {
    const job = openJob()
    db.interviewStages = [
      {
        id: 'stg-1',
        jobId: job.id,
        position: 1,
        name: 'Vòng văn hoá',
        criteria: [{ id: 'c1', label: 'Giao tiếp' }],
      },
    ]
    const iv = db.interviews[0]
    const before = { stageId: iv.stageId, feedbacks: iv.feedbacks }
    iv.stageId = 'stg-1'
    if (!iv.feedbacks.length) {
      iv.feedbacks = [
        { ...({} as (typeof iv.feedbacks)[number]), id: 'fb-x', authorId: iv.interviewerIds[0] },
      ]
    }
    try {
      renderEditor()
      const stage = await screen.findByRole('listitem', { name: 'Vòng 1' })
      expect(within(stage).getByText(/Đã có phiếu đánh giá/)).toBeInTheDocument()
      expect(within(stage).getByRole('button', { name: 'Xoá vòng 1' })).toBeDisabled()
      expect(within(stage).queryByRole('button', { name: 'Thêm tiêu chí' })).not.toBeInTheDocument()
      expect(within(stage).getByLabelText('Tên vòng 1')).toBeEnabled()
    } finally {
      Object.assign(iv, before)
    }
  })

  it('read-only users see an empty state when the job has no stages', async () => {
    renderEditor(false)
    expect(await screen.findByText('Tin chưa chia vòng phỏng vấn')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thêm vòng' })).not.toBeInTheDocument()
  })
})
