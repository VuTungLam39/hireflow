import { setupWorker } from 'msw/browser'
import { adminHandlers } from './handlers/admin'
import { aiHandlers } from './handlers/ai'
import { applicationHandlers } from './handlers/applications'
import { authHandlers } from './handlers/auth'
import { candidateHandlers } from './handlers/candidates'
import { jobHandlers } from './handlers/jobs'
import { publicHandlers } from './handlers/public'

/** Service worker chặn request /api/v1/* và trả dữ liệu giả (chỉ khi VITE_ENABLE_MOCKS=true) */
export const worker = setupWorker(
  ...authHandlers,
  ...adminHandlers,
  ...jobHandlers,
  ...applicationHandlers,
  ...candidateHandlers,
  ...publicHandlers,
  ...aiHandlers,
)
