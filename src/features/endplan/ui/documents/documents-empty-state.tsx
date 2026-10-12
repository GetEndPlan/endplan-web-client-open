import type { ReactNode } from 'react'

type DocumentsEmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function DocumentsEmptyState({
  icon,
  title,
  description,
  action,
}: DocumentsEmptyStateProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col items-center justify-center border border-dashed border-ep-primary-soft bg-white/70 px-6 py-10 text-center sm:px-8 sm:py-12 dark:border-ep-primary/30 dark:bg-ep-surface-panel">
        <div className="mx-auto mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/15 dark:text-ep-primary-muted">
          {icon}
        </div>
        <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mx-auto mt-3 max-w-xl typo-body-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
        {action ? <div className="mt-6 flex shrink-0 justify-center">{action}</div> : null}
      </div>
    </div>
  )
}
