import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

/**
 * Trường phân trang dùng chung. Mỗi trường có `.catch()` để giá trị lạ trên URL
 * (người dùng tự gõ, link cũ) rơi về mặc định thay vì làm vỡ trang.
 */
export const pageFields = {
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
}

/** Trường sort: chỉ nhận cột trong whitelist (khớp whitelist của BE) */
export function sortFields<const F extends readonly [string, ...string[]]>(
  fields: F,
  defaultField: F[number],
) {
  return {
    sortBy: z.enum(fields).catch(defaultField),
    order: z.enum(['ASC', 'DESC']).catch('DESC'),
  }
}

/** Đọc tham số danh sách từ URLSearchParams – dùng được cả trong loader của router */
export function parseListParams<S extends z.ZodType>(
  schema: S,
  searchParams: URLSearchParams,
): z.output<S> {
  return schema.parse(Object.fromEntries(searchParams))
}

type Patch<T> = { [K in keyof T]?: T[K] | null }

/**
 * Bộ lọc, sort, phân trang lưu trên URL (FE Architecture mục 4.4):
 * reload, chia sẻ link, nút back/forward đều giữ đúng trạng thái.
 * Đổi bất kỳ bộ lọc nào thì quay về trang 1 (trừ khi patch có `page`).
 */
export function useListParams<S extends z.ZodType>(schema: S) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseListParams(schema, searchParams), [schema, searchParams])

  const setParams = useCallback(
    (patch: Patch<z.output<S>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        const entries = Object.entries({ page: undefined, ...patch })
        for (const [key, value] of entries) {
          if (value === undefined || value === null || value === '') next.delete(key)
          else next.set(key, String(value))
        }
        return next
      })
    },
    [setSearchParams],
  )

  return [params, setParams] as const
}
