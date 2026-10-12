import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type InlineAlertVariant = 'error' | 'success' | 'info' | 'warning'

type InlineAlertProps = {
  children: ReactNode
  variant?: InlineAlertVariant
  align?: 'left' | 'center' | 'start'
  className?: string
}

const shell: Record<InlineAlertVariant, string> = {
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  info: 'bg-slate-50 dark:bg-ep-primary-dark/60 border-slate-200 dark:border-slate-700',
  warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
}

const text: Record<InlineAlertVariant, string> = {
  error: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400',
  info: 'text-slate-700 dark:text-slate-300',
  warning: 'text-amber-900 dark:text-amber-100',
}

export function InlineAlert({ children, variant = 'error', align = 'left', className }: InlineAlertProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        shell[variant],
        align === 'center' && 'text-center',
        align === 'start' && 'text-left',
        className,
      )}
      role={variant === 'error' ? 'alert' : undefined}
    >
      <p
        className={cn(
          'typo-body-sm',
          text[variant],
          align === 'center' && 'text-center',
          align === 'start' && 'text-left',
        )}
      >
        {children}
      </p>
    </div>
  )
}
