import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ep-primary text-white shadow-sm hover:bg-ep-primary-accent focus-visible:outline-ep-primary dark:bg-ep-primary dark:hover:bg-ep-primary-accent',
  secondary:
    'bg-ep-surface text-ep-primary ring-1 ring-inset ring-ep-primary-soft hover:bg-ep-primary-softer dark:bg-ep-surface-subtle dark:text-ep-primary-nav dark:ring-ep-primary/30 dark:hover:bg-ep-primary/10',
  ghost:
    'bg-transparent text-ep-primary hover:bg-ep-primary-softer dark:text-ep-primary-nav dark:hover:bg-ep-primary/10',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-600',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 typo-button-sm',
  md: 'px-4 py-2 typo-button-md',
  lg: 'px-6 py-3 typo-button-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
