export interface SseEvent {
  event: string
  data: string
}

/**
 * Tách một khối SSE ("event: x\ndata: y") thành { event, data }.
 * Khối không có data (comment, keep-alive) trả về null.
 */
export function parseSseBlock(block: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
  }
  return data.length ? { event, data: data.join('\n') } : null
}
