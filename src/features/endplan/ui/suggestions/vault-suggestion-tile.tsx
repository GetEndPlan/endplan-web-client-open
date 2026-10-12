import type { ReactNode } from 'react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type VaultSuggestionTileProps = {
  title: string
  description?: string
  metaLabel?: string
  icon: ReactNode
  /** When true, shows a check/"added" state and disables interaction. */
  added?: boolean
  addedLabel?: string
  disabled?: boolean
  /** When false, tile is display-only (no click / no + affordance). */
  interactive?: boolean
  onSelect?: () => void
  ariaLabel?: string
  /** `plus` matches contacts/assets; `button` matches instructions "Use template". */
  action?: 'plus' | 'button' | 'none'
  /**
   * Visual for `action="plus"`:
   * - `square` (default): filled plus chip; added shows check + label
   * - `circle`: hollow/complete round marker (documents checklist)
   */
  plusVariant?: 'square' | 'circle'
  actionLabel?: string
  /** `row` is compact horizontal; `card` stacks content for template grids. */
  layout?: 'row' | 'card'
  className?: string
}

export function VaultSuggestionTile({
  title,
  description,
  metaLabel,
  icon,
  added = false,
  addedLabel,
  disabled = false,
  interactive = true,
  onSelect,
  ariaLabel,
  action = 'plus',
  plusVariant = 'square',
  actionLabel,
  layout = 'row',
  className,
}: VaultSuggestionTileProps) {
  const isDisabled = disabled || added || !interactive

  if (layout === 'card') {
    const cardContent = (
      <>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15',
            )}
          >
            {icon}
          </span>
          <span className="min-w-0 pt-1.5 typo-body-sm-strong text-ep-body dark:text-white">{title}</span>
        </div>
        {description ? (
          <span className="mt-2 line-clamp-2 block typo-caption text-slate-500 dark:text-slate-400">
            {description}
          </span>
        ) : null}
        {action === 'button' && interactive ? (
          <span className="mt-4 inline-flex w-fit shrink-0 self-start rounded-md border border-ep-primary/50 px-2.5 py-1 typo-caption-strong text-ep-primary transition group-hover:bg-ep-primary group-hover:text-white">
            {actionLabel}
          </span>
        ) : null}
      </>
    )

    if (!interactive) {
      return (
        <div
          className={cn(
            'flex h-full flex-col rounded-ep-panel border border-ep-border-subtle bg-ep-surface p-4 text-left',
            className,
          )}
        >
          {cardContent}
        </div>
      )
    }

    return (
      <button
        type="button"
        disabled={isDisabled}
        onClick={onSelect}
        aria-label={ariaLabel ?? title}
        className={cn(
          'group flex h-full flex-col items-stretch rounded-ep-panel border border-ep-border-subtle bg-ep-surface p-4 text-left transition',
          isDisabled
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-ep-primary/40 hover:bg-ep-primary-softer/30',
          className,
        )}
      >
        {cardContent}
      </button>
    )
  }

  const content = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          added
            ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
            : 'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate typo-body-sm-strong',
            added ? 'text-slate-400 dark:text-slate-500' : 'text-ep-body dark:text-white',
          )}
        >
          {title}
        </span>
        {metaLabel ? (
          <span className="mt-0.5 block typo-caption text-slate-400 dark:text-slate-500">{metaLabel}</span>
        ) : null}
        {description ? (
          <span className="mt-0.5 line-clamp-2 block typo-caption text-slate-500 dark:text-slate-400">
            {description}
          </span>
        ) : null}
      </span>

      {action === 'button' && interactive && !added ? (
        <span
          className={cn(
            'shrink-0 rounded-ep-pill border border-ep-primary/40 px-2.5 py-1 typo-caption-strong text-ep-primary',
            !isDisabled && 'group-hover:bg-ep-primary group-hover:text-white',
          )}
        >
          {actionLabel}
        </span>
      ) : null}

      {action === 'plus' ? (
        <span className="shrink-0">
          {plusVariant === 'circle' ? (
            <span
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded-full border transition',
                added
                  ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400'
                  : 'border-slate-300 dark:border-slate-600',
                interactive && !added && !isDisabled && 'group-hover:border-ep-primary group-hover:text-ep-primary',
              )}
              aria-hidden
            >
              {added ? <Check className="h-3 w-3" strokeWidth={2.6} /> : null}
            </span>
          ) : added ? (
            <span className="inline-flex items-center gap-1 typo-caption-strong text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              {addedLabel}
            </span>
          ) : interactive ? (
            <span
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md bg-ep-primary text-white transition',
                isDisabled && 'opacity-50',
              )}
            >
              <Plus className="h-4 w-4" />
            </span>
          ) : (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 dark:border-slate-600"
              aria-hidden
            />
          )}
        </span>
      ) : null}
    </>
  )

  if (!interactive) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-ep-panel border border-ep-border-subtle bg-ep-surface px-3 py-3 text-left',
          className,
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onSelect}
      aria-label={ariaLabel ?? title}
      className={cn(
        'group flex items-center gap-3 rounded-ep-panel border px-3 py-3 text-left transition',
        added
          ? 'cursor-default border-ep-border-subtle bg-ep-surface-subtle'
          : isDisabled
            ? 'cursor-not-allowed border-ep-border-subtle bg-ep-surface opacity-60'
            : 'border-ep-border-subtle bg-ep-surface hover:border-ep-primary/40 hover:bg-ep-primary-softer/40',
        className,
      )}
    >
      {content}
    </button>
  )
}
