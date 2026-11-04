import { useMemo } from 'react'
import { foundMarkIds, type EvidenceMarkInput } from '../lib/evidence'
import type { ApplicationDetail } from '../types'

export function useEvidenceMarks(app: ApplicationDetail | undefined, hidden: boolean) {
  const marks = useMemo<EvidenceMarkInput[]>(() => {
    if (!app || hidden) return []
    const byId = new Map(app.breakdown.map((b) => [b.requirementId, b]))
    return app.requirements.flatMap((r, i) => {
      const quote = byId.get(r.id)?.evidence
      return quote ? [{ id: r.id, n: i + 1, quote }] : []
    })
  }, [app, hidden])

  const locatable = useMemo(
    () => (app?.cv?.text ? foundMarkIds(app.cv.text, marks) : new Set<string>()),
    [app, marks],
  )
  return { marks, locatable }
}
