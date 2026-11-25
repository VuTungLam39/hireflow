import { delay, http } from 'msw'
import { db } from '../data'
import {
  api,
  latency,
  authorize,
  fail,
  isStrongPassword,
  ok,
  SESSION_KEY,
  toMe,
  toUser,
  tokenFor,
} from '../http'

/**
 * Giả lập cookie refresh token bằng sessionStorage: tải lại trang vẫn giữ phiên,
 * đóng tab thì mất (giống cookie phiên). Access token là "mock.<userId>".
 */
/** SG-06 · R6: token giả dùng được một lần */
export const MOCK_RESET_TOKEN = 'mock-reset-token-0123456789'
const usedResetTokens = new Set<string>()

export const authHandlers = [
  http.post(api('/auth/forgot-password'), async () => {
    await latency(150)
    return ok(null, { status: 202, message: 'Check your email' })
  }),
  http.post(api('/auth/reset-password'), async ({ request }) => {
    await latency(150)
    const { token, password } = (await request.json()) as { token?: string; password?: unknown }
    if (!isStrongPassword(password))
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        {
          field: 'password',
          messages: ['Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số'],
        },
      ])
    if (token !== MOCK_RESET_TOKEN || usedResetTokens.has(token))
      return fail(400, 'TOKEN_INVALID', 'Token is invalid or expired')
    usedResetTokens.add(token)
    return ok(null, { message: 'Password reset' })
  }),
  http.post(api('/auth/login'), async ({ request }) => {
    await delay()
    const { email, password } = (await request.json()) as { email: string; password: string }
    const user = db.users.find((u) => u.email === email.trim().toLowerCase())
    if (!user || user.password !== password) {
      return fail(401, 'UNAUTHORIZED', 'Invalid email or password')
    }
    if (!user.isActive) return fail(403, 'ACCOUNT_DISABLED', 'Account is disabled')

    user.lastLoginAt = new Date().toISOString()
    sessionStorage.setItem(SESSION_KEY, user.id)
    return ok({ user: toUser(user), tokens: tokenFor(user) }, { message: 'Login successful' })
  }),

  http.post(api('/auth/refresh'), async () => {
    await latency(150)
    const user = db.users.find((u) => u.id === sessionStorage.getItem(SESSION_KEY))
    if (!user?.isActive) return fail(401, 'UNAUTHORIZED', 'Missing refresh token')
    return ok(tokenFor(user))
  }),

  http.post(api('/auth/logout'), async () => {
    sessionStorage.removeItem(SESSION_KEY)
    return ok(null, { message: 'Logged out' })
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    await latency(100)
    const user = authorize(request)
    if (user instanceof Response) return user
    return ok(toMe(user))
  }),

  // BR-ACC-06: BE thu hồi mọi phiên khác; ở đây chỉ có một phiên nên không cần làm gì thêm
  http.patch(api('/auth/password'), async ({ request }) => {
    await delay()
    const user = authorize(request)
    if (user instanceof Response) return user
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword: string
      newPassword: string
    }
    if (user.password !== currentPassword) {
      return fail(400, 'WRONG_PASSWORD', 'Current password is incorrect')
    }
    if (!isStrongPassword(newPassword)) {
      return fail(400, 'VALIDATION_FAILED', 'Validation failed', [
        { field: 'newPassword', messages: ['Mật khẩu 8–72 ký tự, gồm chữ hoa, chữ thường và số'] },
      ])
    }
    Object.assign(user, { password: newPassword, updatedAt: new Date().toISOString() })
    return ok(null, { message: 'Password changed' })
  }),
]
