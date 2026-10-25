import type { HttpHandler } from 'msw'
import { api } from '../http'
import { adminHandlers } from './admin'
import { aiHandlers } from './ai'
import { applicationHandlers } from './applications'
import { authHandlers } from './auth'
import { candidateHandlers } from './candidates'
import { jobHandlers } from './jobs'
import { publicHandlers } from './public'

export const allHandlers: HttpHandler[] = [
  ...authHandlers,
  ...adminHandlers,
  ...jobHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...publicHandlers,
  ...aiHandlers,
]

// Endpoint BE chưa làm (API Contract v1.4) – xoá khỏi danh sách khi BE xong
export const PENDING_ENDPOINTS = [
  'GET /dashboard/summary',
  'GET /files/:fileId/url',
  'GET /public/jobs',
  'GET /public/jobs/:id',
  'POST /public/jobs/:id/apply',
  'POST /ai/chat',
]

const pending = new Set(
  PENDING_ENDPOINTS.map((e) => {
    const [method, path] = e.split(' ')
    return `${method} ${api(path)}`
  }),
)

export const pendingHandlers = allHandlers.filter((h) =>
  pending.has(`${String(h.info.method)} ${String(h.info.path)}`),
)
