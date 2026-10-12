import { cn } from '../lib/cn'

/** Bordered panel for sections inside settings content (recovery key, delete actions, etc.). */
export const settingsSubCardClassName = cn(
  'overflow-hidden border border-ep-border-card bg-ep-surface shadow-sm',
)

/** Inner padding for settings sub-cards (generous vertical space per mockup). */
export const settingsSubCardPaddingClassName = 'px-6 py-8'
