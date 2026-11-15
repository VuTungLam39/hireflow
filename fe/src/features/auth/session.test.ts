import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { Role, type User } from '@/types/user'
import { AxiosError } from 'axios'
import { resetRestoreSession, restoreSession, sessionUnavailable } from './session'

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

  it('P3-01: a guest page skips /auth/refresh when this browser never signed in', async () => {
    localStorage.removeItem('hf_session')
    await restoreSession({ guestPage: true })
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled()
  })

  it('P3-01: a guest page still restores the session of someone who signed in before', async () => {
    localStorage.setItem('hf_session', '1')
    mocks.refreshAccessToken.mockImplementation(async () => {
      useAuthStore.getState().setAccessToken('t')
      return 't'
    })
    mocks.me.mockResolvedValue(user)
    await restoreSession({ guestPage: true })
    expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('P3-01: signing out or a rejected refresh forgets the hint', () => {
    useAuthStore.getState().setAccessToken('t')
    expect(localStorage.getItem('hf_session')).toBe('1')
    useAuthStore.getState().clear()
    expect(localStorage.getItem('hf_session')).toBeNull()
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

  it('keeps the session and allows a retry when the server does not answer', async () => {
    useAuthStore.getState().setUser(user)
    mocks.refreshAccessToken.mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))

    await restoreSession()

    expect(sessionUnavailable()).toBe(true)
    expect(useAuthStore.getState().user).toEqual(user)

    mocks.refreshAccessToken.mockRejectedValueOnce(new Error('401'))
    await restoreSession()
    expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(2)
    expect(sessionUnavailable()).toBe(false)
  })
})
