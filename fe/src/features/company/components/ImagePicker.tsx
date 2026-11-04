import { ImagePlus } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { checkImageFile } from '../lib/check-image'
import { MEDIA_ACCEPT, type MediaKind } from '../types'

export function ImagePicker({
  kind,
  label,
  onPick,
  loading,
  disabled,
  variant = 'secondary',
}: {
  kind: MediaKind
  label: string
  onPick: (file: File) => void
  loading?: boolean
  disabled?: boolean
  variant?: 'secondary' | 'quiet'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={MEDIA_ACCEPT.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          const problem = checkImageFile(file, kind)
          setError(problem)
          if (!problem) onPick(file)
        }}
      />
      <Button
        type="button"
        variant={variant}
        size="sm"
        loading={loading}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus />
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-bad text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
