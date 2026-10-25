import type { HttpHandler } from 'msw'
import { adminHandlers } from './admin'
import { aiHandlers } from './ai'
import { applicationHandlers } from './applications'
import { authHandlers } from './auth'
import { candidateHandlers } from './candidates'
import { jobHandlers } from './jobs'
import { publicHandlers } from './public'

/** API giả theo API Contract, chỉ dùng trong test (component test, contract test) */
export const allHandlers: HttpHandler[] = [
  ...authHandlers,
  ...adminHandlers,
  ...jobHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...publicHandlers,
  ...aiHandlers,
]
