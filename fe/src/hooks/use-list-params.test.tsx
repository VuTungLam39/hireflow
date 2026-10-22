import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { z } from 'zod'
import { pageFields, parseListParams, sortFields, useListParams } from './use-list-params'

const schema = z.object({
  ...pageFields,
  ...sortFields(['createdAt', 'score'] as const, 'createdAt'),
  status: z.enum(['NEW', 'HIRED']).optional().catch(undefined),
})

describe('parseListParams', () => {
  it('uses defaults for missing or invalid values', () => {
    const params = parseListParams(schema, new URLSearchParams('page=-3&sortBy=password&status=X'))
    expect(params).toEqual({ page: 1, limit: 20, sortBy: 'createdAt', order: 'DESC' })
  })

  it('reads valid values', () => {
    const params = parseListParams(schema, new URLSearchParams('page=2&sortBy=score&order=ASC'))
    expect(params).toMatchObject({ page: 2, sortBy: 'score', order: 'ASC' })
  })
})

describe('useListParams', () => {
  it('writes filters to the URL and resets the page', () => {
    let search = ''
    const { result } = renderHook(
      () => {
        search = useLocation().search
        return useListParams(schema)
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <RouterProvider
            router={createMemoryRouter([{ path: '/', element: children }], {
              initialEntries: ['/?page=3'],
            })}
          />
        ),
      },
    )

    act(() => result.current[1]({ status: 'HIRED' }))

    expect(result.current[0]).toMatchObject({ page: 1, status: 'HIRED' })
    expect(search).toBe('?status=HIRED')
  })
})
