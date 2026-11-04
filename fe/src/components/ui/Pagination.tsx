import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@/types/api'
import { Button } from './Button'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

const n = (v: number) => v.toLocaleString('vi-VN')

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalItems === 0 || (!meta.hasPreviousPage && !meta.hasNextPage)) return null

  const from = (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.totalItems)

  return (
    <nav
      aria-label="Phân trang"
      className="type-caption flex flex-wrap items-center justify-between gap-3"
    >
      <span className="num">
        <span className="text-ink-2 font-medium">
          {n(from)}–{n(to)}
        </span>{' '}
        trong {n(meta.totalItems)}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="quiet"
          size="icon-sm"
          aria-label="Trang trước"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="num text-ink-2 min-w-16 text-center">
          {n(meta.page)} / {n(meta.totalPages)}
        </span>
        <Button
          variant="quiet"
          size="icon-sm"
          aria-label="Trang sau"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
