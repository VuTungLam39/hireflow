import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams, type To } from 'react-router'

export type DetailKind = 'application' | 'candidate' | 'job'

const PARAM = 'xem'
const KINDS: readonly DetailKind[] = ['application', 'candidate', 'job']

export function useDetailLink() {
  const { pathname, search } = useLocation()
  return useCallback(
    (kind: DetailKind, id: string, tab?: string): To => {
      const next = new URLSearchParams(search)
      next.set(PARAM, [kind, id, tab].filter(Boolean).join(':'))
      return { pathname, search: `?${next}` }
    },
    [pathname, search],
  )
}

export function useOpenDetail() {
  const navigate = useNavigate()
  const link = useDetailLink()
  return useCallback(
    (kind: DetailKind, id: string, tab?: string, options?: { replace?: boolean }) =>
      void navigate(link(kind, id, tab), options),
    [navigate, link],
  )
}

export function useDetailParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [kind, id, tab] = (searchParams.get(PARAM) ?? '').split(':')
  const valid = KINDS.includes(kind as DetailKind) && !!id

  const close = useCallback(
    () =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete(PARAM)
          return next
        },
        { replace: true },
      ),
    [setSearchParams],
  )

  return { detail: valid ? { kind: kind as DetailKind, id, tab } : null, close }
}
