import { fireEvent, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { toJob } from '@/test/msw/http'
import { renderRouteAs } from '@/test/render'
import { HiringManagerField } from './HiringManagerField'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

// MVP 3.1 · F-JOB-12
describe('HiringManagerField', () => {
  it('HR assigns a hiring manager from another department, then unassigns', async () => {
    const row = db.jobs.find((j) => j.status === 'OPEN')!
    const other = db.users.find(
      (u) => u.role === 'hiring_manager' && u.departmentId !== row.departmentId,
    )!
    renderRouteAs(
      'hr@hireflow.dev',
      [{ path: '/', element: <HiringManagerField job={toJob(row)} canEdit /> }],
      '/',
    )
    const select = await screen.findByRole('combobox', { name: 'Hiring Manager phụ trách' })
    await screen.findByRole('option', { name: new RegExp(other.fullName) })
    fireEvent.change(select, { target: { value: other.id } })
    await waitFor(() => expect(row.hiringManagerId).toBe(other.id))
    fireEvent.change(select, { target: { value: '' } })
    await waitFor(() => expect(row.hiringManagerId).toBeNull())
  })

  it('read-only users just see the name', async () => {
    const row = { ...db.jobs[0], hiringManagerId: null }
    renderRouteAs(
      'hm.eng@hireflow.dev',
      [{ path: '/', element: <HiringManagerField job={toJob(row)} canEdit={false} /> }],
      '/',
    )
    expect(await screen.findByText('Chưa gán')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
