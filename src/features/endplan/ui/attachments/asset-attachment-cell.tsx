import { Eye, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

type AssetAttachmentCellProps = {
  value: string
  label?: string
  disabled?: boolean
  isBusy?: boolean
  isMissing?: boolean
  /** When the cell is empty, focus this control on mount (e.g. after adding a row). */
  autoFocus?: boolean
  onOpen: () => void
  onView?: () => void
  onDelete?: () => void
}

const iconButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-400 dark:hover:bg-ep-surface-subtle dark:hover:text-slate-100'

export function AssetAttachmentCell({
  value,
  label,
  disabled = false,
  isBusy = false,
  isMissing = false,
  autoFocus = false,
  onOpen,
  onView,
  onDelete,
}: AssetAttachmentCellProps) {
  const { t } = useTranslation()
  const hasAttachment = value.trim().length > 0
  const isEmpty = !hasAttachment

  const openModal = () => {
    if (disabled || isBusy) return
    onOpen()
  }

  const handleView = () => {
    if (disabled || isBusy) return
    onView?.()
  }

  const handleDelete = () => {
    if (disabled || isBusy) return
    onDelete?.()
  }

  if (isEmpty) {
    return (
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex min-h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-left transition hover:border-ep-primary-muted hover:bg-ep-primary-softer/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ep-border-card dark:bg-ep-surface-subtle dark:hover:border-ep-primary/40 dark:hover:bg-ep-primary/10"
      >
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500 dark:text-slate-400" />
        ) : (
          <Upload className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
        )}
        <span className="min-w-0 truncate typo-body-sm text-slate-600 dark:text-slate-300">
          {isBusy
            ? t('vault.documentsManager.uploading')
            : isMissing
              ? t('vault.assets.attachments.unavailableLabel')
              : t('vault.assets.attachments.attachAction')}
        </span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-10 w-full items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50/60 py-1 pl-2 pr-1 transition dark:border-ep-border-card dark:bg-ep-surface-subtle',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex min-h-8 min-w-0 flex-1 items-center gap-2 py-1 text-left">
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500 dark:text-slate-400" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
        )}
        <span className="min-w-0 truncate typo-body-sm text-slate-700 dark:text-slate-100">
          {isBusy ? t('vault.documentsManager.uploading') : (label ?? t('vault.assets.attachments.unavailableLabel'))}
        </span>
      </div>
      <button
        type="button"
        onClick={handleView}
        disabled={disabled || isBusy || !onView}
        className={iconButtonClass}
        aria-label={t('common.view')}
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || isBusy || !onDelete}
        className={cn(iconButtonClass, 'hover:text-red-700 dark:hover:text-red-400')}
        aria-label={t('vault.assets.attachments.deleteAction')}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
