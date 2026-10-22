import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/providers'
import { env } from '@/config/env'
import './index.css'

/** Bật API giả (MSW) khi VITE_ENABLE_MOCKS=true. Code mock không vào bundle khi tắt. */
async function enableMocking() {
  if (!env.enableMocks) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

// Router được import sau khi mock sẵn sàng: createBrowserRouter chạy loader gốc
// (restoreSession → /auth/refresh) ngay khi được tạo.
async function bootstrap() {
  await enableMocking()
  const { router } = await import('@/routes/router')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
