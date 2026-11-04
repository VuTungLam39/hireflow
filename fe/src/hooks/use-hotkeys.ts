import { useEffect, useRef } from 'react'

type Handler = (e: KeyboardEvent) => void

export type HotkeyMap = Record<string, Handler>

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    !!el.closest('[role="dialog"],dialog[open]')
  )
}

function keyOf(e: KeyboardEvent) {
  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.shiftKey && e.key.length > 1) parts.push('shift')
  parts.push(e.key.length === 1 ? e.key.toLowerCase() : e.key)
  return parts.join('+')
}

export function useHotkeys(map: HotkeyMap, enabled = true) {
  const ref = useRef(map)
  useEffect(() => {
    ref.current = map
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return
      const key = keyOf(e)
      const handler = ref.current[key]
      if (!handler) return
      if (!key.startsWith('mod+') && isTyping(e.target)) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
