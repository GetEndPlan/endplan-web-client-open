import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CalloutProps = {
  title?: ReactNode
  children: ReactNode
  className?: string
}

export function Callout({ title, children, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-slate-100 dark:bg-ep-surface-panel p-4 space-y-2',
        className,
      )}
    >
      {title ? (
        <p className="typo-body-sm-strong text-ep-body">{title}</p>
      ) : null}
      {children}
    </div>
  )
}
