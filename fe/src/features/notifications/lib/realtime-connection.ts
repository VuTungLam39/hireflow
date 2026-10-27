import { env } from '@/config/env'
import { refreshAccessToken } from '@/lib/api-client'
import { parseSseBlock } from '@/lib/sse'
import { useAuthStore } from '@/stores/auth.store'
import type { RealtimeEvent } from '../types'

export const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000]
export const IDLE_TIMEOUT_MS = 70_000

interface Handlers {
  onEvent: (event: RealtimeEvent) => void
  onStatus: (connected: boolean) => void
}

function open(signal: AbortSignal) {
  const token = useAuthStore.getState().accessToken
  return fetch(`${env.apiUrl}/notifications/stream`, {
    headers: { Accept: 'text/event-stream', ...(token && { Authorization: `Bearer ${token}` }) },
    credentials: 'include',
    signal,
  })
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// F-NOTI-01: một kết nối SSE cho cả ứng dụng, tự nối lại khi mất mạng hoặc server khởi động lại
export function connectRealtime({ onEvent, onStatus }: Handlers): () => void {
  let stopped = false
  let controller: AbortController | null = null

  const readOnce = async () => {
    controller = new AbortController()
    const current = controller
    let res = await open(current.signal)
    if (res.status === 401) {
      await refreshAccessToken()
      res = await open(current.signal)
    }
    if (!res.ok || !res.body) throw new Error(`SSE HTTP ${res.status}`)

    let lastActivity = Date.now()
    const watchdog = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) current.abort()
    }, 10_000)
    try {
      onStatus(true)
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) return
        lastActivity = Date.now()
        buffer += value
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''
        for (const block of blocks) {
          const parsed = parseSseBlock(block)
          if (parsed)
            onEvent({ event: parsed.event, data: JSON.parse(parsed.data) } as RealtimeEvent)
        }
      }
    } finally {
      clearInterval(watchdog)
    }
  }

  void (async () => {
    let attempt = 0
    while (!stopped) {
      const startedAt = Date.now()
      try {
        await readOnce()
      } catch {
        if (stopped) return
      }
      onStatus(false)
      if (stopped) return
      if (Date.now() - startedAt > IDLE_TIMEOUT_MS) attempt = 0
      await wait(RECONNECT_DELAYS_MS[Math.min(attempt++, RECONNECT_DELAYS_MS.length - 1)])
    }
  })()

  return () => {
    stopped = true
    controller?.abort()
    onStatus(false)
  }
}
