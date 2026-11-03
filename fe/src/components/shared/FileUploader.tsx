import { FileText, Upload, X } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { cn, formatFileSize } from '@/lib/utils'

interface FileUploaderProps {
  id: string
  value: File | null
  onChange: (file: File | null) => void
  accept: string[]
  maxSize: number
  error?: string
  progress?: number | null
  disabled?: boolean
}

export function FileUploader({
  id,
  value,
  onChange,
  accept,
  maxSize,
  error,
  progress,
  disabled,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const kinds = accept.map((a) => a.replace('.', '').toUpperCase()).join(' hoặc ')

  const pick = (file: File | undefined) => {
    if (!file) return
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!accept.includes(ext)) {
      setLocalError(`Tệp “${file.name}” không phải ${kinds} – vui lòng chọn tệp ${kinds}`)
      return onChange(null)
    }
    if (file.size > maxSize) {
      setLocalError(
        `Tệp ${formatFileSize(file.size)} – vui lòng chọn tệp dưới ${formatFileSize(maxSize)}`,
      )
      return onChange(null)
    }
    setLocalError(null)
    onChange(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) pick(e.dataTransfer.files[0])
  }

  const message = localError ?? error

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="border-line bg-surface flex items-center gap-3 rounded-md border p-3">
          <FileText className="text-ink-muted size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate font-medium">{value.name}</p>
            <p className="type-caption num">{formatFileSize(value.size)}</p>
            {progress != null && (
              <div
                role="progressbar"
                aria-label="Tiến trình tải lên"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-sunken mt-2 h-1 overflow-hidden rounded-full"
              >
                <div
                  className="bg-brand h-full transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              aria-label="Bỏ tệp đã chọn"
              onClick={() => onChange(null)}
              className="text-ink-muted hover:bg-sunken hover:text-ink rounded-sm p-1.5 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-start gap-1 rounded-md border border-dashed px-4 py-5 transition-colors duration-150 sm:flex-row sm:items-center sm:gap-3',
            dragging
              ? 'border-brand bg-brand-soft'
              : 'border-line bg-surface hover:border-ink-faint',
            message && !dragging && 'border-bad',
          )}
        >
          <Upload
            aria-hidden
            className={cn('size-5 shrink-0', dragging ? 'text-brand' : 'text-ink-muted')}
          />
          <div className="min-w-0">
            <p className="text-ink-2">
              Kéo tệp CV vào đây hoặc{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="text-brand font-medium underline-offset-2 hover:underline disabled:opacity-50"
              >
                chọn từ máy
              </button>
            </p>
            <p className="type-caption">
              {kinds}, dưới {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {message && (
        <p role="alert" className="text-bad text-[13px] leading-5">
          {message}
        </p>
      )}
    </div>
  )
}
