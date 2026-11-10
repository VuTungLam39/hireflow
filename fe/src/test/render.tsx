import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, type RouteObject, RouterProvider } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { db, type UserRow } from './msw/data'
import { tokenFor, toUser } from './msw/http'

export function signInAs(email: string): UserRow {
  const row = db.users.find((u) => u.email === email)
  if (!row) throw new Error(`Không có tài khoản mẫu ${email} trong db`)
  useAuthStore.getState().setSession(toUser(row), tokenFor(row))
  return row
}

export function renderRoutes(routes: RouteObject[], initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...view, router, queryClient }
}

export function renderRouteAs(email: string, routes: RouteObject[], initialEntry: string) {
  const user = signInAs(email)
  return { user, ...renderRoutes(routes, initialEntry) }
}
