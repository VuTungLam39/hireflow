import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Checkbox, Pagination, Skeleton, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Density } from '@/stores/ui.store'
import type { PaginationMeta, SortOrder } from '@/types/api'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortKey?: string
  className?: string
  align?: 'left' | 'right'
  isAction?: boolean
  hideOnMobile?: boolean
}

interface SortState {
  sortBy: string
  order: SortOrder
  onChange: (sortBy: string, order: SortOrder) => void
}

export interface Selection {
  selected: ReadonlySet<string>
  onChange: (next: Set<string>) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | undefined
  rowKey: (row: T) => string
  isPending: boolean
  isError: boolean
  error?: unknown
  onRetry?: () => void
  isFetching?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  sort?: SortState
  meta?: PaginationMeta
  onPageChange?: (page: number) => void
  density?: Density
  selection?: Selection
  bulkBar?: (count: number) => ReactNode
  onRowClick?: (row: T) => void
  onRowOpen?: (row: T) => void
  activeRowKey?: string
  rowLabel?: (row: T) => string
  rowActions?: (row: T) => ReactNode
  mobileRow?: (row: T) => ReactNode
  caption?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isPending,
  isError,
  error,
  onRetry,
  isFetching,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription,
  emptyAction,
  sort,
  meta,
  onPageChange,
  density = 'comfortable',
  selection,
  bulkBar,
  onRowClick,
  onRowOpen,
  activeRowKey,
  rowLabel,
  rowActions,
  mobileRow,
  caption,
}: DataTableProps<T>) {
  if (isPending) return <TableSkeleton columns={columns.length} density={density} />
  if (isError) return <ErrorState error={error} onRetry={onRetry} />
  if (!data?.length)
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />

  const keys = data.map(rowKey)
  const selectedCount = selection ? keys.filter((k) => selection.selected.has(k)).length : 0
  const allSelected = selectedCount === keys.length
  const interactive = !!(onRowClick || onRowOpen)

  const toggleSort = (key: string) => {
    if (!sort) return
    const order: SortOrder = sort.sortBy === key && sort.order === 'DESC' ? 'ASC' : 'DESC'
    sort.onChange(key, order)
  }

  const toggleRow = (key: string) => {
    if (!selection) return
    const next = new Set(selection.selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    selection.onChange(next)
  }

  const toggleAll = () => {
    if (!selection) return
    const next = new Set(selection.selected)
    for (const k of keys) {
      if (allSelected) next.delete(k)
      else next.add(k)
    }
    selection.onChange(next)
  }

  const onRowKey = (e: KeyboardEvent, row: T) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter') (onRowOpen ?? onRowClick)?.(row)
    if (e.key === ' ' && onRowClick) {
      e.preventDefault()
      onRowClick(row)
    }
  }

  const rowH = density === 'compact' ? 'h-10' : 'h-[52px]'
  const dataCols = columns.filter((c) => !c.isAction)
  const actionCols = columns.filter((c) => c.isAction)

  return (
    <div className="space-y-4">
      <div className={cn('relative', isFetching && 'opacity-70 transition-opacity')}>
        {isFetching && (
          <Spinner className="text-brand absolute -top-6 right-0 size-3.5" label="Đang cập nhật" />
        )}

        <div className="border-line bg-surface -mx-4 hidden border-y md:mx-0 md:block md:rounded-md md:border md:max-lg:overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {selection && (
                  <th scope="col" className={cn(thClass, 'w-10 pr-0 first:rounded-tl-md')}>
                    <Checkbox
                      aria-label="Chọn tất cả dòng trên trang"
                      checked={allSelected}
                      indeterminate={selectedCount > 0 && !allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                )}
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
                        thClass,
                        col.align === 'right' && 'text-right',
                        'first:rounded-tl-md last:rounded-tr-md',
                        col.className,
                      )}
                    >
                      {col.sortKey && sort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.sortKey!)}
                          className={cn(
                            'group/sort hover:text-ink inline-flex items-center gap-1 transition-colors',
                            col.align === 'right' && 'flex-row-reverse',
                            active && 'text-ink',
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
                            <ArrowUpDown className="size-3.5 opacity-0 transition-opacity group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  )
                })}
                {rowActions && (
                  <th scope="col" className={cn(thClass, 'w-px')}>
                    <span className="sr-only">Thao tác</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const key = rowKey(row)
                const active = key === activeRowKey
                const checked = selection?.selected.has(key) ?? false
                return (
                  <tr
                    key={key}
                    tabIndex={interactive ? 0 : undefined}
                    aria-label={interactive && rowLabel ? rowLabel(row) : undefined}
                    aria-selected={selection ? checked : undefined}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a,button,input,label,select')) return
                      onRowClick?.(row)
                    }}
                    onDoubleClick={() => onRowOpen?.(row)}
                    onKeyDown={interactive ? (e) => onRowKey(e, row) : undefined}
                    className={cn(
                      'group/row transition-colors duration-100 focus-visible:-outline-offset-2',
                      interactive && 'cursor-pointer',
                      checked || active ? 'bg-brand-soft/50' : 'hover:bg-canvas',
                    )}
                  >
                    {selection && (
                      <td className={cn(tdClass, rowH, 'w-10 pr-0')}>
                        <Checkbox
                          aria-label={`Chọn ${rowLabel?.(row) ?? 'dòng'}`}
                          checked={checked}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td
                        key={col.key}
                        className={cn(
                          tdClass,
                          rowH,
                          col.align === 'right' && 'num text-right',
                          i === 0 &&
                            !selection &&
                            active &&
                            'shadow-[inset_2px_0_0_var(--color-brand)]',
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={cn(tdClass, rowH, 'w-px pl-0 whitespace-nowrap')}>
                        <div className="flex justify-end gap-1">{rowActions(row)}</div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ul className="border-line bg-surface divide-line-soft -mx-4 divide-y border-y md:hidden">
          {data.map((row) => {
            const key = rowKey(row)
            const checked = selection?.selected.has(key) ?? false
            return (
              <li
                key={key}
                className={cn(
                  'flex gap-3 px-4 py-3',
                  (checked || key === activeRowKey) && 'bg-brand-soft/50',
                )}
              >
                {selection && (
                  <span className="pt-0.5">
                    <Checkbox
                      aria-label={`Chọn ${rowLabel?.(row) ?? 'dòng'}`}
                      checked={checked}
                      onChange={() => toggleRow(key)}
                    />
                  </span>
                )}
                <div
                  className={cn('min-w-0 flex-1', interactive && 'cursor-pointer')}
                  onClick={() => (onRowClick ?? onRowOpen)?.(row)}
                >
                  {mobileRow ? (
                    mobileRow(row)
                  ) : (
                    <dl className="space-y-1.5">
                      {dataCols
                        .filter((c) => !c.hideOnMobile)
                        .map((col, i) =>
                          i === 0 ? (
                            <div key={col.key}>{col.cell(row)}</div>
                          ) : (
                            <div key={col.key} className="flex items-center justify-between gap-4">
                              <dt className="type-caption shrink-0">{col.header}</dt>
                              <dd className="min-w-0 text-right">{col.cell(row)}</dd>
                            </div>
                          ),
                        )}
                    </dl>
                  )}
                </div>
                {(actionCols.length > 0 || rowActions) && (
                  <div className="flex shrink-0 items-start gap-1">
                    {actionCols.map((col) => (
                      <span key={col.key}>{col.cell(row)}</span>
                    ))}
                    {rowActions?.(row)}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {meta && onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}

      {selection && bulkBar && selection.selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 md:pl-[var(--rail-w,0px)]">
          <div
            role="region"
            aria-label="Thao tác hàng loạt"
            className="bg-ink shadow-float animate-float-in pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-md px-3 py-2 text-white"
          >
            {bulkBar(selection.selected.size)}
          </div>
        </div>
      )}
    </div>
  )
}

const thClass =
  'border-line bg-surface type-overline sticky top-[var(--sticky-top,3.5rem)] z-10 h-10 border-b px-4 whitespace-nowrap first:rounded-tl-md first:pl-5 last:rounded-tr-md'
const tdClass =
  'border-line-soft border-b px-4 align-middle first:pl-5 [tr:last-child_&]:border-b-0'

function TableSkeleton({ columns, density }: { columns: number; density: Density }) {
  return (
    <div
      className="border-line bg-surface -mx-4 overflow-hidden border-y md:mx-0 md:rounded-md md:border"
      aria-busy
      aria-label="Đang tải"
    >
      <div className="border-line bg-sunken h-9 border-b" />
      {Array.from({ length: 8 }, (_, row) => (
        <div
          key={row}
          className={cn(
            'border-line-soft flex items-center gap-6 border-b px-5 last:border-b-0',
            density === 'compact' ? 'h-10' : 'h-[52px]',
          )}
        >
          <div className="flex flex-[2] items-center gap-3">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          {Array.from({ length: Math.min(columns - 1, 4) }, (_, col) => (
            <Skeleton key={col} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
