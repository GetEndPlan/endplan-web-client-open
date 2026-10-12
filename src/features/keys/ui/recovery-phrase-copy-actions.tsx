import { ClipboardCopy, Download } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type RecoveryPhraseCopyActionsProps = {
  copyLabel: string
  downloadLabel: string
  disabled?: boolean
  onCopy: () => void
  onDownloadPdf: () => void
}

/**
 * Copy + “Download as PDF” row aligned to match recovery onboarding reference:
 * soft gray pill for copy; sky underlined link + download icon for PDF.
 */
export function RecoveryPhraseCopyActions({
  copyLabel,
  downloadLabel,
  disabled,
  onCopy,
  onDownloadPdf,
}: RecoveryPhraseCopyActionsProps) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onCopy}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-100 px-4 py-2.5 typo-body-sm-strong text-slate-700',
          'shadow-sm transition hover:bg-slate-200/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ep-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-slate-600 dark:bg-ep-surface-panel dark:text-slate-200 dark:hover:bg-slate-700',
        )}
      >
        <ClipboardCopy className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" aria-hidden />
        {copyLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onDownloadPdf}
        className={cn(
          'inline-flex items-center gap-1.5 typo-body-sm-strong text-sky-600 underline decoration-sky-600/45 underline-offset-[3px]',
          'transition hover:text-sky-700 hover:decoration-sky-700/50',
          'dark:text-sky-400 dark:decoration-sky-400/45 dark:hover:text-sky-300',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        {downloadLabel}
      </button>
    </div>
  )
}
