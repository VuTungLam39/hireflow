import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { Role, type User } from '@/types/user'
import { resetRestoreSession, restoreSession } from './session'

const mocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn<() => Promise<string>>(),
  me: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('@/lib/api-client', () => ({ refreshAccessToken: mocks.refreshAccessToken }))
vi.mock('./api/auth.api', () => ({ authApi: { me: mocks.me } }))

const user: User = {
  id: '1',
  email: 'u@example.com',
  fullName: 'User',
  role: Role.Hr,
  departmentId: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: '',
  updatedAt: '',
}

describe('restoreSession', () => {
  beforeEach(() => {
    resetRestoreSession()
    queryClient.clear()
    useAuthStore.getState().clear()
    mocks.refreshAccessToken.mockReset()
    mocks.me.mockReset()
  })

  it('restores token and user from the refresh cookie', async () => {
    mocks.refreshAccessToken.mockImplementation(async () => {
      useAuthStore.getState().setAccessToken('new-token')
      return 'new-token'
    })
    mocks.me.mockResolvedValue(user)

    await restoreSession()

    expect(useAuthStore.getState().accessToken).toBe('new-token')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('stays logged out when there is no valid cookie', async () => {
    mocks.refreshAccessToken.mockRejectedValue(new Error('401'))

    await restoreSession()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(mocks.me).not.toHaveBeenCalled()
  })

  it('runs only once per page load', async () => {
    mocks.refreshAccessToken.mockRejectedValue(new Error('401'))

    await Promise.all([restoreSession(), restoreSession()])
    await restoreSession()

    expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('skips refresh when a token is already in memory', async () => {
    useAuthStore.getState().setAccessToken('existing')

    await restoreSession()

    expect(mocks.refreshAccessToken).not.toHaveBeenCalled()
  })
})
