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

interface RankingTableProps {
  rows: Ranked<RankingInput>[]
  requirements: Requirement[]
  savedRank: Map<string, number>
}

export const RankingTable = memo(function RankingTable({
  rows,
  requirements,
  savedRank,
}: RankingTableProps) {
  return (
    <Profiler id="ranking-table" onRender={onProfilerRender}>
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="py-2.5 pr-3 pl-4 font-medium">Hạng</th>
              <th className="py-2.5 pr-3 font-medium">Ứng viên</th>
              <th className="py-2.5 pr-3 font-medium">Điểm</th>
              {requirements.map((req) => (
                <th
                  key={req.id}
                  className="hidden max-w-20 truncate py-2.5 pr-3 text-center font-medium normal-case md:table-cell"
                  title={req.label}
                >
                  {req.label}
                </th>
              ))}
              <th className="py-2.5 pr-4 font-medium">Trạng thái</th>
            </tr>
          </thead>
          {rows.length > VIRTUALIZE_FROM ? (
            <VirtualBody rows={rows} requirements={requirements} savedRank={savedRank} />
          ) : (
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <Row
                  key={row.item.id}
                  row={row}
                  requirements={requirements}
                  savedRank={savedRank}
                />
              ))}
            </tbody>
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
  index,
  measureRef,
}: {
  row: Ranked<RankingInput>
  requirements: Requirement[]
  savedRank: Map<string, number>
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
      index={index}
      measureRef={measureRef}
    />
  )
}

function VirtualBody({ rows, requirements, savedRank }: RankingTableProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (el) setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
  }, [])

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
  const colSpan = requirements.length + 4

  return (
    <tbody ref={bodyRef} className="divide-y divide-slate-100 bg-white">
      {paddingTop > 0 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingTop, padding: 0 }} />
        </tr>
      )}
      {items.map((virtual) => (
        <Row
          key={virtual.key}
          row={rows[virtual.index]}
          requirements={requirements}
          savedRank={savedRank}
          index={virtual.index}
          measureRef={virtualizer.measureElement}
        />
      ))}
      {paddingBottom > 0 && (
        <tr aria-hidden>
          <td colSpan={colSpan} style={{ height: paddingBottom, padding: 0 }} />
        </tr>
      )}
    </tbody>
  )
}
