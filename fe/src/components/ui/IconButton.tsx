import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button-variants'
import { Tooltip } from './Tooltip'

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'secondary'
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label} className={className}>
      <button
        type={type}
        aria-label={label}
        className={cn(buttonVariants({ variant, size: size === 'sm' ? 'icon-sm' : 'icon' }))}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
