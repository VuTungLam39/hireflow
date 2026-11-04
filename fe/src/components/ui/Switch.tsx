import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  showLabel?: boolean
}

export function Switch({ checked, onChange, label, disabled, showLabel = true }: SwitchProps) {
  return (
    <label
      className={cn('inline-flex items-center gap-2.5', disabled ? 'opacity-60' : 'cursor-pointer')}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
          checked ? 'bg-brand' : 'bg-line',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'bg-surface size-4 rounded-full transition-transform duration-150',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {showLabel && <span className="text-ink-2">{label}</span>}
    </label>
  )
}
