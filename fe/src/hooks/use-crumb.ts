import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui.store'

export function useCrumb(title: string | undefined, back?: string) {
  const setCrumb = useUiStore((s) => s.setCrumb)
  useEffect(() => {
    if (!title) return
    setCrumb({ title, back })
    return () => setCrumb(null)
  }, [title, back, setCrumb])
}
