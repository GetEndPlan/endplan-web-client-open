import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const base =
  'typo-body-sm text-slate-600 dark:text-slate-400 hover:text-ep-primary dark:hover:text-ep-primary-accent disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors'

export type MutedTextButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

/** Text-style secondary action (e.g. resend code) — not a navigation link. */
export function MutedTextButton({ className, type = 'button', children, ...props }: MutedTextButtonProps) {
  return (
    <button type={type} className={cn(base, className)} {...props}>
      {children}
    </button>
  )
}
