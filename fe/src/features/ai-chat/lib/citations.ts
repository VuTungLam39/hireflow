/** Một đoạn câu trả lời: chữ thường hoặc trích dẫn [candidateId#chunkId] (kickoff mục 8.5) */
export type Segment =
  { type: 'text'; text: string } | { type: 'citation'; candidateId: string; chunkId: string }

const CITATION = /\[([\w-]+)#([\w-]+)\]/g

export function parseCitations(content: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  for (const match of content.matchAll(CITATION)) {
    if (match.index > last) segments.push({ type: 'text', text: content.slice(last, match.index) })
    segments.push({ type: 'citation', candidateId: match[1], chunkId: match[2] })
    last = match.index + match[0].length
  }
  if (last < content.length) segments.push({ type: 'text', text: content.slice(last) })
  return segments
}
