import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SplitFeatureLayoutProps = {
  /** Narrow / explainer column (e.g. help text). */
  primary: ReactNode
  /** Main interactive column. */
  secondary: ReactNode
  className?: string
}

/**
 * Responsive two-column layout: single column on small screens, 2+3 split from `lg`.
 */
export function SplitFeatureLayout({ primary, secondary, className }: SplitFeatureLayoutProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-5 gap-8', className)}>
      <div className="lg:col-span-2 space-y-4">{primary}</div>
      <div className="lg:col-span-3">{secondary}</div>
    </div>
  )
}
