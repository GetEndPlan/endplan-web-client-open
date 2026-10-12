import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type AuthFormFooterProps = {
  children: ReactNode
  /** Adds top border and padding (e.g. “wrong email” actions). */
  divided?: boolean
  className?: string
}

export function AuthFormFooter({ children, divided = false, className }: AuthFormFooterProps) {
  return (
    <div
      className={cn(
        'text-center typo-body-sm text-slate-600 dark:text-slate-400',
        divided && 'pt-4 border-t border-slate-200 dark:border-slate-700',
        className,
      )}
    >
      {children}
    </div>
  )
}
