import { setupWorker } from 'msw/browser'
import { allHandlers, pendingHandlers } from './handlers'

export const createWorker = (mode: 'all' | 'pending') =>
  setupWorker(...(mode === 'all' ? allHandlers : pendingHandlers))
