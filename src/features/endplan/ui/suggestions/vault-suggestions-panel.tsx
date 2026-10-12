import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type VaultSuggestionsPanelProps = {
  title: string
  subtitle: string
  onDismiss?: () => void
  dismissLabel?: string
  children: ReactNode
  className?: string
}

/** Shared dismissible shell for section suggestion strips shown above main content. */
export function VaultSuggestionsPanel({
  title,
  subtitle,
  onDismiss,
  dismissLabel,
  children,
  className,
}: VaultSuggestionsPanelProps) {
  return (
    <section
      className={cn(
        'rounded-ep-card border border-ep-border-subtle bg-ep-surface p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="typo-body-sm-strong text-ep-body dark:text-white">{title}</h3>
          <p className="typo-caption text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-ep-surface-subtle hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            aria-label={dismissLabel ?? 'Dismiss'}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  )
}
