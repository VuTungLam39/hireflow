import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'

interface FilterBarProps {
  children: ReactNode
  /** Hiện nút "Xoá lọc" khi có bộ lọc đang bật */
  onReset?: () => void
}

/** Khung chứa bộ lọc. Giá trị bộ lọc nằm trên URL (useListParams), không ở đây. */
export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Xoá lọc
        </Button>
      )}
    </div>
  )
}

interface SearchInputProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  label?: string
}

const DEBOUNCE_MS = 300

/** Ô tìm kiếm có debounce 300ms: gõ liên tục không gửi request mỗi phím */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label = 'Tìm kiếm',
}: SearchInputProps) {
  const [text, setText] = useState(value ?? '')
  const [prevValue, setPrevValue] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // URL đổi từ bên ngoài (back/forward, Xoá lọc) → cập nhật ô nhập ngay trong lúc render
  if (value !== prevValue) {
    setPrevValue(value)
    setText(value ?? '')
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleChange = (next: string) => {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(next.trim() || undefined), DEBOUNCE_MS)
  }

  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={placeholder}
      className="w-full sm:max-w-xs"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
    />
  )
}
