import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { operationHandlers } from '@/test/msw/handlers/operations'
import { renderRouteAs } from '@/test/render'
import AiQueuePage from './AiQueuePage'

const server = setupServer(...authHandlers, ...operationHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

function renderAsAdmin() {
  renderRouteAs(
    'admin@hireflow.dev',
    [{ path: paths.aiQueue, element: <AiQueuePage /> }],
    paths.aiQueue,
  )
}

// F-OPS-01
describe('AiQueuePage', () => {
  it('lists failed applications with their reason and every pipeline queue', async () => {
    const failed = db.applications.filter((a) => a.aiStatus === 'FAILED')
    renderAsAdmin()

    expect(await screen.findByText(`${failed.length} hồ sơ cần xử lý`)).toBeInTheDocument()
    expect(screen.queryByText(`${failed.length} hồ sơ`)).not.toBeInTheDocument()
    expect(
      screen.getAllByText('Không đọc được nội dung PDF (có thể là file scan)').length,
    ).toBeGreaterThan(0)
    const queues = screen.getByRole('region', { name: 'Số việc trong hàng đợi' })
    for (const label of ['Đọc CV', 'Trích xuất', 'Chấm điểm', 'Lập chỉ mục tìm kiếm', 'Tổng']) {
      expect(within(queues).getByText(label)).toBeInTheDocument()
    }
  })

  it('retries every failed application after confirmation', async () => {
    const user = userEvent.setup()
    renderAsAdmin()
    await user.click(await screen.findByRole('button', { name: /^Chạy lại \d+ hồ sơ$/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chạy lại' }))

    expect(await screen.findByText('Không có hồ sơ nào cần xử lý')).toBeInTheDocument()
    expect(screen.queryByText(/hồ sơ cần xử lý$/)).not.toBeInTheDocument()
    expect(db.applications.some((a) => a.aiStatus === 'FAILED')).toBe(false)
    expect(screen.queryByRole('button', { name: /^Chạy lại \d+ hồ sơ$/ })).not.toBeInTheDocument()
  })
})
