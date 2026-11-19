import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { DECIDED_TRACK_TOKEN, publicHandlers, TRACK_TOKEN } from '@/test/msw/handlers/public'
import { renderRoutes } from '@/test/render'
import TrackApplicationPage from './TrackApplicationPage'

const server = setupServer(...publicHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const routes = [{ path: paths.applicationTrack, element: <TrackApplicationPage /> }]
const open = (token: string) => renderRoutes(routes, `${paths.applicationTrack}?t=${token}`)

// MVP 3 · US-26, BR-APP-14
describe('TrackApplicationPage', () => {
  it('shows the reduced status and lets the candidate withdraw after confirming', async () => {
    open(TRACK_TOKEN)
    expect(await screen.findByRole('heading', { name: 'Đang xem xét' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Backend Developer (NestJS)' })).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Rút hồ sơ' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Rút hồ sơ' }))

    expect(await screen.findByRole('heading', { name: 'Bạn đã rút hồ sơ' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rút hồ sơ' })).not.toBeInTheDocument()
  })

  it('a decided application hides the withdraw button', async () => {
    open(DECIDED_TRACK_TOKEN)
    expect(await screen.findByRole('heading', { name: 'Đã có kết quả' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rút hồ sơ' })).not.toBeInTheDocument()
  })

  it('an invalid link says so without giving a reason', async () => {
    open('wrong-token-1234567890')
    expect(
      await screen.findByRole('heading', { name: 'Link không còn hiệu lực' }),
    ).toBeInTheDocument()
  })
})
