import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { memo, Profiler, useLayoutEffect, useRef, useState } from 'react'
import type { Requirement } from '@/features/jobs'
import { onProfilerRender } from '@/lib/profiler'
import type { Ranked } from '../lib/score'
import type { RankingInput } from '../types'
import { RankingRow } from './RankingRow'

// FE Architecture 9.1
export const VIRTUALIZE_FROM = 200
const ESTIMATED_ROW_HEIGHT = 53
const OVERSCAN = 8
const MOVE_MS = 200

interface RankingTableProps {
  rows: Ranked<RankingInput>[]
  requirements: Requirement[]
  savedRank: Map<string, number>
  selectedId?: string | null
  onSelect?: (id: string) => void
}

const th =
  'border-line bg-surface type-overline sticky top-[var(--sticky-top,3.5rem)] z-10 h-10 border-b whitespace-nowrap'

export const RankingTable = memo(function RankingTable({
  rows,
  requirements,
  savedRank,
  selectedId,
  onSelect,
}: RankingTableProps) {
  return (
    <Profiler id="ranking-table" onRender={onProfilerRender}>
      <div className="border-line bg-surface -mx-4 border-y md:mx-0 md:rounded-md md:border">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Xếp hạng ứng viên theo mức phù hợp</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} w-24 pr-2 pl-4 md:rounded-tl-md`}>
                #
              </th>
              <th scope="col" className={`${th} pr-3`}>
                Ứng viên
              </th>
              <th scope="col" className={`${th} hidden pr-3 sm:table-cell`}>
                Tiêu chí
              </th>
              <th scope="col" className={`${th} pr-4 text-right md:rounded-tr-md`}>
                Điểm
              </th>
            </tr>
          </thead>
          {rows.length > VIRTUALIZE_FROM ? (
            <VirtualBody
              rows={rows}
              requirements={requirements}
              savedRank={savedRank}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ) : (
            <FlipBody
              rows={rows}
              requirements={requirements}
              savedRank={savedRank}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </table>
      </div>
    </Profiler>
  )
})

function Row({
  row,
  requirements,
  savedRank,
  selectedId,
  onSelect,
  index,
  measureRef,
}: Omit<RankingTableProps, 'rows'> & {
  row: Ranked<RankingInput>
  index?: number
  measureRef?: (el: HTMLTableRowElement | null) => void
}) {
  const { item, score, rank } = row
  return (
    <RankingRow
      item={item.item}
      matches={item.matches}
      requirements={requirements}
      rank={rank}
      score={score}
      delta={(savedRank.get(item.id) ?? rank) - rank}
      selected={selectedId === item.id}
      onSelect={onSelect}
      index={index}
      measureRef={measureRef}
    />
  )
}

function FlipBody(props: RankingTableProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const tops = useRef(new Map<string, number>())
  const order = props.rows.map((r) => r.item.id).join('|')

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, number>()
    const moved: HTMLElement[] = []
    for (const el of body.querySelectorAll<HTMLElement>('tr[data-key]')) {
      const key = el.dataset.key!
      const top = el.offsetTop
      next.set(key, top)
      const prev = tops.current.get(key)
      if (!reduce && prev !== undefined && prev !== top) {
        el.style.transition = 'none'
        el.style.transform = `translateY(${prev - top}px)`
        moved.push(el)
      }
    }
    tops.current = next
    if (!moved.length) return
    void body.offsetHeight
    for (const el of moved) {
      el.style.transition = `transform ${MOVE_MS}ms cubic-bezier(0.2, 0, 0, 1)`
      el.style.transform = ''
    }
  }, [order])

  return (
    <tbody ref={bodyRef}>
      {props.rows.map((row) => (
        <Row key={row.item.id} row={row} {...props} />
      ))}
    </tbody>
  )
}

function VirtualBody({ rows, ...rest }: RankingTableProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (el) setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
  }, [])

  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey: (index) => rows[index].item.id,
  })

  const items = virtualizer.getVirtualItems()
  const paddingTop = items.length ? items[0].start - scrollMargin : 0
  const paddingBottom = items.length
    ? virtualizer.getTotalSize() - (items.at(-1)!.end - scrollMargin)
    : 0

  return (
    <tbody ref={bodyRef}>
      {paddingTop > 0 && (
        <tr aria-hidden>
          <td colSpan={4} style={{ height: paddingTop, padding: 0 }} />
        </tr>
      )}
      {items.map((virtual) => (
        <Row
          key={virtual.key}
          row={rows[virtual.index]}
          {...rest}
          index={virtual.index}
          measureRef={virtualizer.measureElement}
        />
      ))}
      {paddingBottom > 0 && (
        <tr aria-hidden>
          <td colSpan={4} style={{ height: paddingBottom, padding: 0 }} />
        </tr>
      )}
    </tbody>
  )
}
