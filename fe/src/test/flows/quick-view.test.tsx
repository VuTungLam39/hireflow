import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import ApplicationsPage from '@/features/applications/pages/ApplicationsPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const signIn = (email: string) => {
  const me = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(me), tokenFor(me))
}

const open = (search: string) => {
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
  return router
}

const nameOf = (id: string) => {
  const app = db.applications.find((a) => a.id === id)!
  return db.candidates.find((c) => c.id === app.candidateId)!.fullName
}

const peekOf = (router: ReturnType<typeof open>) =>
  new URLSearchParams(router.state.location.search).get('nhanh')

// DL-16 · P5-D10b
describe('quick view Sheet', () => {
  it('opens from ?nhanh=, is read-only, steps through the list and closes from the URL', async () => {
    signIn('hr@hireflow.dev')
    const id = db.applications.filter((a) => a.status === 'SCREENING')[0].id
    const router = open(`?status=SCREENING&nhanh=${id}&sortBy=createdAt&order=DESC`)

    const sheet = await screen.findByRole('dialog', { name: nameOf(id) })
    expect(within(sheet).getByText('Để chuyển trạng thái, mở chi tiết hồ sơ.')).toBeInTheDocument()
    expect(within(sheet).getByRole('link', { name: 'Mở chi tiết' })).toHaveAttribute(
      'href',
      expect.stringContaining(id),
    )
    expect(within(sheet).queryByRole('button', { name: /Từ chối|Chuyển|Offer/ })).toBeNull()

    const [step] = await within(sheet).findAllByRole('button', { name: /Hồ sơ (sau|trước)/ })
    fireEvent.click(step)
    await waitFor(() => expect(peekOf(router)).not.toBe(id))
    expect(peekOf(router)).toBeTruthy()

    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(peekOf(router)).toBeNull())
  })

  it('shows an interviewer the interview schedule read-only, without the feedback panel', async () => {
    signIn('interviewer@hireflow.dev')
    const iv = db.interviews.find((i) => i.interviewerIds.includes('u-iv1'))!
    open(`?nhanh=${iv.applicationId}`)

    const sheet = await screen.findByRole('dialog', { name: nameOf(iv.applicationId) })
    expect(await within(sheet).findByRole('heading', { name: 'Phỏng vấn' })).toBeInTheDocument()
    await waitFor(() => expect(within(sheet).queryByText('Chưa có lịch phỏng vấn.')).toBeNull())
    const buttons = within(sheet)
      .queryAllByRole('button')
      .map((b) => b.getAttribute('aria-label') ?? b.textContent)
    expect(buttons.every((b) => /Đóng|Hồ sơ (trước|sau)/.test(b ?? ''))).toBe(true)
  })
})
