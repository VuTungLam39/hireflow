import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createMemoryRouter, RouterProvider } from 'react-router'
import ChatPage from '@/features/ai-chat/pages/ChatPage'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/test/msw/data'
import { allHandlers } from '@/test/msw/handlers'
import { tokenFor, toUser } from '@/test/msw/http'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// US-08 · BR-AI-10
describe('Hỏi kho CV', () => {
  it('streams the whole answer with citations and announces only the start and end', async () => {
    const row = db.users.find((u) => u.email === 'hr@hireflow.dev')!
    useAuthStore.getState().setSession(toUser(row), tokenFor(row))
    const router = createMemoryRouter([{ path: paths.aiChat, element: <ChatPage /> }], {
      initialEntries: [paths.aiChat],
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /NestJS trên 2 năm/ }))
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đang trả lời…'))

    expect(await screen.findByText('Nguồn', undefined, { timeout: 8000 })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đã trả lời xong')
    const answer = screen.getByRole('article')
    expect(answer).toHaveTextContent(/^Tìm thấy \d ứng viên phù hợp/)
    expect(answer).toHaveTextContent(/Bấm vào số trích dẫn để mở hồ sơ và xem đoạn CV gốc\.Nguồn/)
    expect(screen.getAllByRole('button', { name: /^Nguồn \d+:/ }).length).toBeGreaterThan(0)
    expect(document.querySelector('[aria-live]')).toBeNull()
  }, 15000)
})
