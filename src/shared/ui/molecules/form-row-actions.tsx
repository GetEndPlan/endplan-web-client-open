import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type FormRowActionsProps = {
  start: ReactNode
  end: ReactNode
  className?: string
}

export function FormRowActions({ start, end, className }: FormRowActionsProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">{start}</div>
      <div className="shrink-0">{end}</div>
    </div>
  )
}
