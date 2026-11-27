import * as RS from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase } from './field-styles'
import { usePortalContainer } from './portal-container'

export interface RichSelectOption {
  value: string
  label: string
  description?: ReactNode
  icon?: ReactNode
}

interface RichSelectProps {
  options: RichSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  className?: string
}

/** Chỉ khi lựa chọn cần nội dung giàu (mô tả, icon); danh sách chữ thường dùng Select native */
export function RichSelect({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  ...aria
}: RichSelectProps) {
  const container = usePortalContainer()
  return (
    <RS.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RS.Trigger
        {...aria}
        className={cn(
          fieldBase,
          'data-placeholder:text-ui-muted flex h-9 items-center justify-between gap-2 px-3 text-left',
          className,
        )}
      >
        <RS.Value placeholder={placeholder} />
        <RS.Icon>
          <ChevronDown aria-hidden className="text-ui-muted size-4" />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal container={container}>
        <RS.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className="border-line bg-surface shadow-float z-50 max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border"
        >
          <RS.Viewport className="p-1">
            {options.map((o) => (
              <RS.Item
                key={o.value}
                value={o.value}
                className="text-ui-fg-2 data-highlighted:bg-ui-sunken data-highlighted:text-ui-fg rounded-inset flex cursor-default items-start gap-2.5 px-2.5 py-2 text-sm outline-none select-none [&_svg]:size-4"
              >
                {o.icon && <span className="mt-0.5 shrink-0">{o.icon}</span>}
                <span className="min-w-0 flex-1">
                  <RS.ItemText>{o.label}</RS.ItemText>
                  {o.description && <span className="type-caption block">{o.description}</span>}
                </span>
                <RS.ItemIndicator className="mt-0.5">
                  <Check className="text-ui-primary" />
                </RS.ItemIndicator>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  )
}
