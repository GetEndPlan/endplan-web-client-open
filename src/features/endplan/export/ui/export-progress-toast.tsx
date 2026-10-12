import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cancelEndplanExport } from '../lib/start-endplan-export'
import { useEndplanExportStore } from '../model/export-job-store'
import { endplanExportPercent } from '../model/export-job-types'

function progressSubtitle(
  t: ReturnType<typeof useTranslation>['t'],
  status: ReturnType<typeof useEndplanExportStore.getState>['status'],
  progress: ReturnType<typeof useEndplanExportStore.getState>['progress'],
  stopReason: ReturnType<typeof useEndplanExportStore.getState>['stopReason'],
): string {
  if (status === 'done') return t('settings.export.progress.doneSubtitle')
  if (status === 'error') return t('settings.export.progress.errorSubtitle')
  if (status === 'cancelled') {
    return stopReason === 'locked'
      ? t('settings.export.progress.cancelledLockedSubtitle')
      : t('settings.export.progress.cancelledSubtitle')
  }
  if (!progress) return t('settings.export.progress.keepTabOpen')

  switch (progress.stage) {
    case 'preparing':
      return t('settings.export.progress.preparing')
    case 'overview':
      return t('settings.export.progress.overview')
    case 'assets':
      return t('settings.export.progress.assets')
    case 'policies':
      return t('settings.export.progress.policies')
    case 'contacts':
      return t('settings.export.progress.contacts')
    case 'instructions':
      return t('settings.export.progress.instructions')
    case 'documents':
      if (progress.itemCount && progress.itemIndex) {
        return t('settings.export.progress.documentsCounted', {
          completed: progress.itemIndex,
          total: progress.itemCount,
        })
      }
      return t('settings.export.progress.documents')
    case 'attachments':
      if (progress.itemCount && progress.itemIndex) {
        return t('settings.export.progress.attachmentsCounted', {
          completed: progress.itemIndex,
          total: progress.itemCount,
        })
      }
      return t('settings.export.progress.attachments')
    case 'packaging':
      return t('settings.export.progress.packaging')
    default:
      return t('settings.export.progress.keepTabOpen')
  }
}

export function ExportProgressToast() {
  const { t } = useTranslation()
  const status = useEndplanExportStore((state) => state.status)
  const progress = useEndplanExportStore((state) => state.progress)
  const stopReason = useEndplanExportStore((state) => state.stopReason)
  const toastHidden = useEndplanExportStore((state) => state.toastHidden)
  const hideToast = useEndplanExportStore((state) => state.hideToast)

  if (typeof document === 'undefined' || toastHidden || status === 'idle') {
    return null
  }

  const isRunning = status === 'running'
  const title = isRunning
    ? t('settings.export.progress.titleActive')
    : status === 'done'
      ? t('settings.export.progress.titleDone')
      : status === 'error'
        ? t('settings.export.progress.titleError')
        : t('settings.export.progress.titleCancelled')
  const percent = isRunning ? endplanExportPercent(progress) : 100
  const barClassName =
    status === 'error'
      ? 'bg-red-500 dark:bg-red-400'
      : status === 'cancelled'
        ? 'bg-slate-400 dark:bg-slate-500'
        : 'bg-emerald-500 dark:bg-emerald-400'

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
          onClick={hideToast}
          className="inline-flex shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-ep-surface-panel dark:hover:text-gray-100"
          aria-label={t('settings.export.progress.closeAria')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="typo-caption-strong mb-3 text-gray-500 dark:text-slate-400">
        {progressSubtitle(t, status, progress, stopReason)}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isRunning ? (
        <button
          type="button"
          onClick={() => cancelEndplanExport('user')}
          className="mt-3 typo-caption-strong text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
        >
          {t('settings.export.progress.cancel')}
        </button>
      ) : null}
    </div>,
    document.body,
  )
}
