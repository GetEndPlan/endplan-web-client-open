import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { VaultDocumentUploadProgress } from '../../hooks/documents/use-vault-documents-page'

type DocumentsUploadProgressToastProps = {
  progress: VaultDocumentUploadProgress | null
  onDismiss: () => void
}

/** Bottom-right upload card (Design Document Page UI `.upload-toast`). Rendered via portal. */
export function DocumentsUploadProgressToast({ progress, onDismiss }: DocumentsUploadProgressToastProps) {
  const { t } = useTranslation()

  if (typeof document === 'undefined' || !progress) {
    return null
  }

  const title = progress.isDone
    ? t('vault.documentsManager.uploadProgressTitleDone')
    : t('vault.documentsManager.uploadProgressTitleActive')
  const subtitle = progress.isDone
    ? t('vault.documentsManager.uploadProgressSubtitleDone', { total: progress.totalFiles })
    : t('vault.documentsManager.uploadProgressSubtitleActive', {
        completed: progress.completedFiles,
        total: progress.totalFiles,
      })

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[1000] w-[min(360px,calc(100vw-3rem))] animate-[upload-toast-in_0.25s_ease] rounded-xl border border-gray-200 bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <style>{`
        @keyframes upload-toast-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="typo-body-sm-strong min-w-0 truncate text-gray-900 dark:text-gray-100">{title}</div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-ep-surface-panel dark:hover:text-gray-100"
          aria-label={t('vault.documentsManager.uploadProgressCloseAria')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="typo-caption-strong mb-3 text-gray-500 dark:text-slate-400">{subtitle}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out dark:bg-emerald-400"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
    </div>,
    document.body,
  )
}
