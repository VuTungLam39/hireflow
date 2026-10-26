import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/providers'
import { hydrateQueryCache, readPrerenderPayload, resolveLazyRoutes } from '@/prerender/hydrate'
import { createAppRouter, ROOT_ROUTE_ID, routes } from '@/routes/router'
import './index.css'

async function bootstrap() {
  const container = document.getElementById('root')!
  const prerendered = readPrerenderPayload()

  if (!prerendered) {
    const router = createAppRouter()
    createRoot(container).render(
      <StrictMode>
        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
      </StrictMode>,
    )
    return
  }

  // F-PUB-04
  hydrateQueryCache(prerendered)
  await resolveLazyRoutes(routes, window.location)
  const router = createAppRouter({ hydrationData: { loaderData: { [ROOT_ROUTE_ID]: null } } })
  hydrateRoot(
    container,
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
