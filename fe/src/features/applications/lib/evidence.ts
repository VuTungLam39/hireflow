export interface EvidenceMarkInput {
  id: string
  n: number
  quote: string
}

export interface CvToken {
  text: string
  mark?: { id: string; n: number }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function findQuote(text: string, quote: string): [number, number] | null {
  const q = quote.trim()
  if (!q) return null
  const exact = text.indexOf(q)
  if (exact >= 0) return [exact, exact + q.length]
  const words = q.split(/\s+/).filter(Boolean).map(escape)
  if (!words.length) return null
  const m = new RegExp(words.join('\\s+'), 'iu').exec(text)
  return m ? [m.index, m.index + m[0].length] : null
}

export function tokenizeCv(text: string, marks: EvidenceMarkInput[]): CvToken[][] {
  const ranges = marks
    .map((m) => {
      const r = findQuote(text, m.quote)
      return r ? { start: r[0], end: r[1], id: m.id, n: m.n } : null
    })
    .filter((r): r is NonNullable<typeof r> => !!r)
    .sort((a, b) => a.start - b.start)

  const tokens: CvToken[] = []
  let cursor = 0
  for (const r of ranges) {
    if (r.start < cursor) continue
    if (r.start > cursor) tokens.push({ text: text.slice(cursor, r.start) })
    tokens.push({ text: text.slice(r.start, r.end), mark: { id: r.id, n: r.n } })
    cursor = r.end
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor) })

  const paragraphs: CvToken[][] = [[]]
  for (const t of tokens) {
    const parts = t.text.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) paragraphs.push([])
      if (part) paragraphs[paragraphs.length - 1].push({ ...t, text: part })
    })
  }
  return paragraphs
}

export function foundMarkIds(text: string, marks: EvidenceMarkInput[]) {
  return new Set(marks.filter((m) => findQuote(text, m.quote)).map((m) => m.id))
}
