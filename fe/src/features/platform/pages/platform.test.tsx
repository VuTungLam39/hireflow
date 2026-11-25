import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { authHandlers } from '@/test/msw/handlers/auth'
import { platformHandlers } from '@/test/msw/handlers/platform'
import { renderRouteAs } from '@/test/render'
import PlatformCompaniesPage from './PlatformCompaniesPage'
import PlatformCompanyDetailPage from './PlatformCompanyDetailPage'
import PlatformQueuesPage from './PlatformQueuesPage'

const server = setupServer(...authHandlers, ...platformHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const routes = [
  { path: paths.platformCompanies, element: <PlatformCompaniesPage /> },
  { path: paths.platformCompany, element: <PlatformCompanyDetailPage /> },
  { path: paths.platformQueues, element: <PlatformQueuesPage /> },
]
const renderAsPlatform = (entry: string) => renderRouteAs('platform@hireflow.dev', routes, entry)

// MVP 3 · US-20, F-PLAT-01
describe('Platform companies', () => {
  it('lists companies waiting for approval by default, and every company under "Tất cả"', async () => {
    const user = userEvent.setup()
    renderAsPlatform(paths.platformCompanies)

    const table = await screen.findByRole('table', { name: 'Danh sách công ty trên sàn' })
    expect(await within(table).findByText('Công ty Sao Việt')).toBeInTheDocument()
    expect(within(table).getByText('Đại Lộc Logistics')).toBeInTheDocument()
    expect(within(table).queryByText('Ví Mây')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Tất cả' }))
    expect(await within(table).findByText('Ví Mây')).toBeInTheDocument()
  })

  it('approves a pending company after confirmation', async () => {
    const user = userEvent.setup()
    const org = db.organizations.find((o) => o.name === 'Công ty Sao Việt')!
    renderAsPlatform(`/platform/companies/${org.id}`)

    await user.click(await screen.findByRole('button', { name: 'Duyệt' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Duyệt' }))

    expect(await screen.findByText('Đang hoạt động')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Khoá công ty' })).toBeInTheDocument()
    expect(org.status).toBe('ACTIVE')
  })

  it('BR-ORG-04: suspending needs a reason, which is then shown on the page', async () => {
    const user = userEvent.setup()
    const org = db.organizations.find((o) => o.name === 'Ví Mây')!
    renderAsPlatform(`/platform/companies/${org.id}`)

    await user.click(await screen.findByRole('button', { name: 'Khoá công ty' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Khoá công ty' }))
    expect(within(dialog).getByText('Nhập lý do để tiếp tục')).toBeInTheDocument()

    await user.type(within(dialog).getByRole('textbox'), 'Đăng tin sai sự thật')
    await user.click(within(dialog).getByRole('button', { name: 'Khoá công ty' }))

    expect(await screen.findByText('Đăng tin sai sự thật')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mở khoá' })).toBeInTheDocument()
  })

  it('shows no action for a rejected company', async () => {
    const org = db.organizations.find((o) => o.status === 'REJECTED')!
    renderAsPlatform(`/platform/companies/${org.id}`)
    expect(await screen.findByText('Mã số thuế không tồn tại')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Duyệt|Khoá|Mở khoá|Từ chối/ })).toBeNull()
  })

  it('KH MVP 3 mục 8.2: shows the system-wide queue counts', async () => {
    renderAsPlatform(paths.platformQueues)
    const queues = await screen.findByRole('region', { name: 'Số việc trong hàng đợi' })
    for (const label of ['Đọc CV', 'Trích xuất', 'Chấm điểm', 'Lập chỉ mục tìm kiếm']) {
      expect(await within(queues).findByText(label)).toBeInTheDocument()
    }
    expect(within(queues).getByText('Tổng')).toBeInTheDocument()
  })

  it('US-25: shows today against the limits and 7 days of usage, and saves new limits', async () => {
    const user = userEvent.setup()
    const org = db.organizations.find((o) => o.name === 'Đại Lộc Logistics')!
    renderAsPlatform(`/platform/companies/${org.id}`)

    const table = await screen.findByRole('table', { name: 'Lượt đã dùng 7 ngày gần nhất' })
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(within(table).getByText(/^Hôm nay/)).toBeInTheDocument()

    const score = screen.getByLabelText('Hạn mức đọc CV mỗi ngày')
    expect(score).toHaveValue(300)
    await user.clear(score)
    await user.type(score, '-5')
    await user.click(screen.getByRole('button', { name: 'Lưu hạn mức' }))
    expect(await screen.findByText('Tối thiểu 0')).toBeInTheDocument()

    await user.clear(score)
    await user.type(score, '1200')
    await user.click(screen.getByRole('button', { name: 'Lưu hạn mức' }))
    await vi.waitFor(() => expect(org.aiDailyScoreLimit).toBe(1200))
    expect(screen.getByRole('button', { name: 'Lưu hạn mức' })).toBeDisabled()
  })
})

// RR-13 · slice 12b
describe('Platform company totals', () => {
  it('explains a zero count instead of showing a bare 0', async () => {
    const org = db.organizations.find((o) => o.name === 'Ví Mây')!
    const saved = { userCount: org.userCount, openJobs: org.openJobs, apps: org.applications30d }
    Object.assign(org, { openJobs: 0, applications30d: 0 })
    try {
      renderAsPlatform(`/platform/companies/${org.id}`)
      expect(await screen.findByText(/chưa đăng tin nào/)).toBeInTheDocument()
      expect(screen.getByText(/không có hồ sơ trong 30 ngày qua/)).toBeInTheDocument()
      expect(screen.queryByText(/chưa có tài khoản nào/)).toBeNull()
    } finally {
      Object.assign(org, {
        userCount: saved.userCount,
        openJobs: saved.openJobs,
        applications30d: saved.apps,
      })
    }
  })
})
