import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { parseListParams } from '@/hooks/use-list-params'
import { links, paths } from '@/routes/paths'
import { applicationListSchema } from '../schemas/application.schema'
import { applicationQueries } from './use-applications'

export interface ReviewState {
  listQuery?: string
}

export function useReviewNavigation(id: string) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listQuery = (location.state as ReviewState | null)?.listQuery
  const params = useMemo(
    () =>
      listQuery !== undefined
        ? parseListParams(applicationListSchema, new URLSearchParams(listQuery))
        : null,
    [listQuery],
  )

  const list = useQuery({
    ...applicationQueries.list(
      params ?? parseListParams(applicationListSchema, new URLSearchParams()),
    ),
    enabled: !!params,
  })

  const items = useMemo(() => list.data?.items ?? [], [list.data])
  const meta = list.data?.meta
  const index = items.findIndex((a) => a.id === id)
  const position = meta && index >= 0 ? (meta.page - 1) * meta.limit + index + 1 : null

  const backTo = listQuery ? `${paths.applications}?${listQuery}` : paths.applications

  const go = useCallback(
    async (delta: 1 | -1) => {
      if (!params || !meta || index < 0) return
      let target = items[index + delta]
      let page = meta.page
      if (!target) {
        page = meta.page + delta
        if (page < 1 || page > meta.totalPages) return
        const next = await queryClient.fetchQuery(applicationQueries.list({ ...params, page }))
        target = delta === 1 ? next.items[0] : next.items[next.items.length - 1]
      }
      if (!target) return
      const q = new URLSearchParams(listQuery)
      if (page > 1) q.set('page', String(page))
      else q.delete('page')
      void navigate(links.applicationDetail(target.id), {
        state: { listQuery: q.toString() } satisfies ReviewState,
      })
    },
    [params, meta, index, items, queryClient, listQuery, navigate],
  )

  return {
    enabled: !!params && position !== null,
    position,
    total: meta?.totalItems ?? null,
    hasPrev: position !== null && position > 1,
    hasNext: position !== null && meta ? position < meta.totalItems : false,
    prev: () => void go(-1),
    next: () => void go(1),
    backTo,
  }
}
