import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

type DocumentsWorkspaceIconButtonProps = {
  label: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  spin?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
}

export function DocumentsWorkspaceIconButton({
  label,
  children,
  onClick,
  disabled = false,
  spin = false,
  variant = 'primary',
  className,
}: DocumentsWorkspaceIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'border-ep-primary bg-ep-primary text-white hover:bg-ep-primary-accent focus-visible:outline-ep-primary dark:border-ep-primary dark:bg-ep-primary dark:hover:bg-ep-primary'
          : 'border-ep-primary-soft bg-white text-ep-primary-accent hover:bg-ep-primary-softer focus-visible:outline-ep-primary dark:border-ep-primary/30 dark:bg-ep-surface-panel dark:text-ep-primary-muted dark:hover:bg-slate-700',
        className,
      )}
    >
      <span className={cn(spin ? 'animate-spin' : '')}>{children}</span>
    </button>
  )
}
