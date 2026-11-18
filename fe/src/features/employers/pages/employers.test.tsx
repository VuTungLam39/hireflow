import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { db } from '@/test/msw/data'
import { employerHandlers, VERIFY_TOKEN } from '@/test/msw/handlers/platform'
import { renderRoutes } from '@/test/render'
import CheckEmailPage from './CheckEmailPage'
import EmployerRegisterPage from './EmployerRegisterPage'
import VerifyEmailPage from './VerifyEmailPage'

const server = setupServer(...employerHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const routes = [
  { path: paths.employerRegister, element: <EmployerRegisterPage /> },
  { path: paths.employerCheckEmail, element: <CheckEmailPage /> },
  { path: paths.verifyEmail, element: <VerifyEmailPage /> },
]

async function fillForm(taxCode: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Tên công ty'), 'Công ty Mới')
  await user.type(screen.getByLabelText('Mã số thuế'), taxCode)
  await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn Văn A')
  await user.type(screen.getByLabelText('Email công việc'), 'a@congtymoi.vn')
  await user.type(screen.getByLabelText('Mật khẩu'), 'Password123')
  return user
}

// MVP 3 · US-19, BR-ACC-09
describe('Employer registration', () => {
  it('validates the form, then sends the user to check their email', async () => {
    renderRoutes(routes, paths.employerRegister)
    const user = await fillForm('0312345678')
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(await screen.findByText('Cần đồng ý điều khoản sử dụng sàn')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))

    expect(await screen.findByRole('heading', { name: 'Kiểm tra email' })).toBeInTheDocument()
    expect(screen.getByText('a@congtymoi.vn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi lại sau \d+ giây/ })).toBeDisabled()
  })

  it('BR-ORG-05: shows the duplicated tax code under its field', async () => {
    const taken = db.organizations.find((o) => o.taxCode)!.taxCode!
    renderRoutes(routes, paths.employerRegister)
    const user = await fillForm(taken)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(await screen.findByText('Mã số thuế đã được đăng ký trên sàn')).toBeInTheDocument()
  })

  it('verifies the email from the link', async () => {
    renderRoutes(routes, `${paths.verifyEmail}?t=${VERIFY_TOKEN}`)
    expect(
      await screen.findByRole('heading', { name: 'Email đã được xác minh' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', paths.login)
  })

  it('does not say why a link is refused, and offers to resend it', async () => {
    renderRoutes(routes, `${paths.verifyEmail}?t=used-or-expired-token`)
    expect(
      await screen.findByRole('heading', { name: 'Link không còn hiệu lực' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gửi lại email xác minh' })).toHaveAttribute(
      'href',
      paths.employerCheckEmail,
    )
  })
})
