import { useCallback, useEffect, useRef, useState } from 'react'
import { env } from '@/config/env'
import { refreshAccessToken } from '@/lib/api-client'
import { parseSseBlock, type SseEvent } from '@/lib/sse'
import { useAuthStore } from '@/stores/auth.store'

interface StreamRequest {
  /** Đường dẫn sau apiUrl, ví dụ '/ai/chat' */
  path: string
  body: unknown
  onEvent: (event: SseEvent) => void
}

function send(path: string, body: unknown, signal: AbortSignal) {
  const token = useAuthStore.getState().accessToken
  return fetch(`${env.apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  })
}

/**
 * Đọc response SSE bằng fetch + ReadableStream (EventSource không gửi được POST
 * và header Authorization – kickoff mục 8.5).
 * - 401: refresh access token một lần rồi gửi lại.
 * - Gửi yêu cầu mới hoặc unmount: huỷ stream cũ bằng AbortController.
 */
export function useStream() {
  const controllerRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Cleanup khi rời trang: đóng stream đang chạy
  useEffect(() => () => controllerRef.current?.abort(), [])

  const start = useCallback(async ({ path, body, onEvent }: StreamRequest) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsStreaming(true)

    try {
      let res = await send(path, body, controller.signal)
      if (res.status === 401) {
        await refreshAccessToken()
        res = await send(path, body, controller.signal)
      }
      if (!res.ok || !res.body) throw new Error(`Stream thất bại (HTTP ${res.status})`)

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''
        for (const block of blocks) {
          const event = parseSseBlock(block)
          if (event) onEvent(event)
        }
      }
    } catch (error) {
      // Bị huỷ chủ động thì không coi là lỗi
      if (!controller.signal.aborted) throw error
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsStreaming(false)
      }
    }
  }, [])

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setIsStreaming(false)
  }, [])

  return { start, stop, isStreaming }
}
