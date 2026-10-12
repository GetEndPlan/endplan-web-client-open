import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type SectionIntroProps = {
  title: ReactNode
  description?: ReactNode
  className?: string
}

export function SectionIntro({ title, description, className }: SectionIntroProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="typo-heading-card text-ep-primary dark:text-ep-primary-accent">{title}</h2>
      {description ? (
        <p className="typo-body-sm text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
    </div>
  )
}
