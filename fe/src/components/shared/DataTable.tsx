import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Pagination, Skeleton, Spinner } from '@/components/ui'
import { cn, staggerStyle } from '@/lib/utils'
import type { PaginationMeta, SortOrder } from '@/types/api'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Tên cột gửi lên BE khi sort. Chỉ khai báo cho cột nằm trong whitelist của BE. */
  sortKey?: string
  className?: string
  /** Cột hành động: trên mobile hiện ở cuối card, không có nhãn */
  isAction?: boolean
}

interface SortState {
  sortBy: string
  order: SortOrder
  onChange: (sortBy: string, order: SortOrder) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | undefined
  rowKey: (row: T) => string
  isPending: boolean
  isError: boolean
  error?: unknown
  onRetry?: () => void
  /** Đang tải lại ngầm (đổi trang, đổi bộ lọc) – hiện spinner nhỏ, giữ dữ liệu cũ */
  isFetching?: boolean
  emptyTitle?: string
  emptyDescription?: string
  sort?: SortState
  meta?: PaginationMeta
  onPageChange?: (page: number) => void
}

/**
 * Bảng dữ liệu dùng chung (R7, R8):
 * - Đủ 4 trạng thái: loading (skeleton), error (thử lại), empty, success.
 * - Từ 768px là bảng; dưới 768px tự chuyển thành danh sách card.
 * - Sort chỉ trên cột có `sortKey`; phân trang offset theo `meta` của BE.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  isPending,
  isError,
  error,
  onRetry,
  isFetching,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  sort,
  meta,
  onPageChange,
}: DataTableProps<T>) {
  if (isPending) return <TableSkeleton columns={columns.length} />
  if (isError) return <ErrorState error={error} onRetry={onRetry} />
  if (!data?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />

  const toggleSort = (key: string) => {
    if (!sort) return
    const order: SortOrder = sort.sortBy === key && sort.order === 'DESC' ? 'ASC' : 'DESC'
    sort.onChange(key, order)
  }

  return (
    <div className="space-y-4">
      <div className={cn('relative transition-opacity duration-200', isFetching && 'opacity-60')}>
        {isFetching && <Spinner className="text-primary absolute top-3 right-3 z-10 size-4" />}

        {/* Từ md trở lên: bảng */}
        <div className="relative hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                {columns.map((col) => {
                  const active = sort?.sortBy === col.sortKey
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={
                        active ? (sort?.order === 'ASC' ? 'ascending' : 'descending') : undefined
                      }
                      className={cn(
                        'px-4 py-2.5 font-medium whitespace-nowrap first:pl-5',
                        col.className,
                      )}
                    >
                      {col.sortKey && sort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.sortKey!)}
                          className={cn(
                            'inline-flex items-center gap-1 uppercase transition-colors hover:text-slate-900',
                            active && 'text-slate-900',
                          )}
                        >
                          {col.header}
                          {active ? (
                            sort.order === 'ASC' ? (
                              <ArrowUp className="size-3.5" />
                            ) : (
                              <ArrowDown className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  style={staggerStyle(index)}
                  className="animate-fade-in stagger transition-colors hover:bg-slate-50/80"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 align-middle first:pl-5', col.className)}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dưới md: danh sách card */}
        <ul className="space-y-3 md:hidden">
          {data.map((row, index) => (
            <li
              key={rowKey(row)}
              style={staggerStyle(index)}
              className="animate-slide-up stagger shadow-card rounded-xl border border-slate-200 bg-white p-4"
            >
              <dl className="space-y-2 text-sm">
                {columns
                  .filter((col) => !col.isAction)
                  .map((col) => (
                    <div key={col.key} className="flex items-center justify-between gap-4">
                      <dt className="shrink-0 text-xs text-slate-500">{col.header}</dt>
                      <dd className="min-w-0 text-right">{col.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
              {columns
                .filter((col) => col.isAction)
                .map((col) => (
                  <div
                    key={col.key}
                    className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3"
                  >
                    {col.cell(row)}
                  </div>
                ))}
            </li>
          ))}
        </ul>
      </div>

      {meta && onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200" aria-busy>
      <div className="h-10 border-b border-slate-200 bg-slate-50/80" />
      <div className="space-y-4 p-5">
        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} className="flex gap-4">
            {Array.from({ length: Math.min(columns, 5) }, (_, col) => (
              <Skeleton key={col} className={cn('h-4 flex-1', col === 0 && 'flex-[2]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
