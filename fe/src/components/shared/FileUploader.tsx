import { CloudUpload, FileText, X } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { cn, formatFileSize } from '@/lib/utils'

interface FileUploaderProps {
  id: string
  value: File | null
  onChange: (file: File | null) => void
  /** Đuôi file được nhận, ví dụ ['.pdf', '.docx'] */
  accept: string[]
  maxSize: number
  /** Lỗi từ form / server */
  error?: string
  /** 0–100 khi đang upload */
  progress?: number | null
  disabled?: boolean
}

/**
 * Chọn file bằng kéo thả hoặc bấm. Kiểm đuôi và dung lượng ở client cho nhanh;
 * server vẫn kiểm lại (mime + magic bytes).
 */
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

  const pick = (file: File | undefined) => {
    if (!file) return
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!accept.includes(ext)) {
      setLocalError(`Chỉ nhận file ${accept.join(', ')}`)
      return onChange(null)
    }
    if (file.size > maxSize) {
      setLocalError(`File tối đa ${formatFileSize(maxSize)}`)
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
        <div className="animate-scale-in flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-lg">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{value.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(value.size)}</p>
          </div>
          {!disabled && (
            <button
              type="button"
              aria-label="Bỏ file"
              onClick={() => onChange(null)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
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
            'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors duration-150',
            dragging
              ? 'border-primary bg-primary-soft'
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300',
            message && 'border-red-300 bg-red-50/40',
          )}
        >
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-transform',
              dragging && 'text-primary -translate-y-0.5',
            )}
          >
            <CloudUpload className="size-5" />
          </div>
          <p className="text-slate-600">
            Kéo thả file vào đây hoặc{' '}
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              chọn từ máy
            </button>
          </p>
          <p className="text-xs text-slate-400">
            {accept.join(', ').toUpperCase()} · tối đa {formatFileSize(maxSize)}
          </p>
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
          e.target.value = '' // cho phép chọn lại cùng một file
        }}
      />

      {progress != null && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="bg-primary h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
