/**
 * Render thử 2 trang kho ứng viên trên API giả (MSW): đủ trạng thái tải, đúng quyền hiện nút.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { db } from '@/test/msw/data'
import { applicationHandlers } from '@/test/msw/handlers/applications'
import { authHandlers } from '@/test/msw/handlers/auth'
import { candidateHandlers } from '@/test/msw/handlers/candidates'
import { tokenFor, toUser } from '@/test/msw/http'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { candidatesApi } from '../api/candidates.api'
import CandidateDetailPage from './CandidateDetailPage'
import CandidatesPage from './CandidatesPage'

const server = setupServer(...authHandlers, ...applicationHandlers, ...candidateHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

/** Đăng nhập thẳng bằng token của API giả (không đi qua feature auth – luật tầng) */
async function loginAs(email: string) {
  const row = db.users.find((u) => u.email === email)!
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: paths.candidates, element: <CandidatesPage /> },
      { path: paths.candidateDetail, element: <CandidateDetailPage /> },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('candidate pages', () => {
  it('lists candidates and offers to load more', async () => {
    await loginAs('hr@hireflow.dev')
    const first = (await candidatesApi.list({ limit: 20 })).items[0]
    renderAt(paths.candidates)
    // DataTable vẽ cả bảng (desktop) và card (mobile) nên mỗi link có 2 bản
    expect(await screen.findAllByRole('link', { name: first.fullName })).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Tải thêm' })).toBeInTheDocument()
  })

  it('shows the anonymize action to admin only (BR-DATA-03)', async () => {
    await loginAs('hr@hireflow.dev')
    const target = (await candidatesApi.list({ limit: 1 })).items[0]

    renderAt(`/candidates/${target.id}`)
    expect(await screen.findByText(/Các lần nộp/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ẩn danh ứng viên/ })).not.toBeInTheDocument()
    // Email là khoá định danh: luôn khoá (BR-CAND-01)
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Họ tên')).toBeEnabled()

    await loginAs('admin@hireflow.dev')
    renderAt(`/candidates/${target.id}`)
    expect(await screen.findByRole('button', { name: /Ẩn danh ứng viên/ })).toBeInTheDocument()
  })
})
