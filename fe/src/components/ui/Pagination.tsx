import type { PaginationMeta } from '@/types/api'
import { Button } from './Button'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalItems === 0) return null

  const from = (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.totalItems)

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
      <span>
        {from}–{to} / {meta.totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Trước
        </Button>
        <span>
          Trang {meta.page}/{meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}
