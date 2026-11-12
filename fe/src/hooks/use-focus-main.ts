import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

export function useFocusMainOnNavigate() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
}
