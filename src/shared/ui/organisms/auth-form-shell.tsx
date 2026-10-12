import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type AuthFormShellProps = {
  children: ReactNode
  className?: string
}

/** Vertical rhythm wrapper for auth-style stacked forms (header, form, footer). */
export function AuthFormShell({ children, className }: AuthFormShellProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}
