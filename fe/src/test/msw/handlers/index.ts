import type { HttpHandler } from 'msw'
import { adminHandlers } from './admin'
import { aiHandlers } from './ai'
import { applicationHandlers } from './applications'
import { authHandlers } from './auth'
import { candidateHandlers } from './candidates'
import { jobHandlers } from './jobs'
import { matchingHandlers } from './matching'
import { operationHandlers } from './operations'
import { interviewHandlers } from './interviews'
import { auditHandlers, notificationHandlers } from './notifications'
import { publicHandlers } from './public'

/** API giả theo API Contract, chỉ dùng trong test (component test, contract test) */
export const allHandlers: HttpHandler[] = [
  ...authHandlers,
  ...adminHandlers,
  ...jobHandlers,
  ...matchingHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...publicHandlers,
  ...aiHandlers,
  ...operationHandlers,
  ...notificationHandlers,
  ...auditHandlers,
  ...interviewHandlers,
]
