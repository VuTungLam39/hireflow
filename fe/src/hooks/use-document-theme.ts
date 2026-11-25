import { useLayoutEffect } from 'react'

// P5-D14c
export function useDocumentTheme(theme: 'v2') {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    return () => {
      delete root.dataset.theme
    }
  }, [theme])
}
