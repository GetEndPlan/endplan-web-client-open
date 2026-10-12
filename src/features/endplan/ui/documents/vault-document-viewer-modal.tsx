import { lazy, Suspense, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Button, DEFAULT_MODAL_BACKDROP_CLASSNAME, Spinner } from '@/shared/ui'
import { toViewerFile } from '../../model/document-viewer-capabilities'

const OmniDocViewer = lazy(async () => {
  const module = await import('omni-doc-viewer/react')
  return { default: module.DocViewer }
})

export type VaultDocumentViewerModalProps = {
  isOpen: boolean
  file: { name: string; mimeType?: string | null } | null
  blob: Blob | null
  isLoading: boolean
  isDownloadOnly: boolean
  error: string | null
  onClose: () => void
  onDownload: () => void
}

export function VaultDocumentViewerModal({
  isOpen,
  file,
  blob,
  isLoading,
  isDownloadOnly,
  error,
  onClose,
  onDownload,
}: VaultDocumentViewerModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !file || typeof document === 'undefined') {
    return null
  }

  const viewerSource =
    blob && !isDownloadOnly && !error
      ? toViewerFile(blob, file.name, file.mimeType)
      : null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-document-viewer-title"
    >
      <div
        className={cn('absolute inset-0', DEFAULT_MODAL_BACKDROP_CLASSNAME)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-xl border border-ep-border-card bg-ep-surface shadow-2xl">
          <header className="flex shrink-0 items-center gap-3 border-b border-ep-border-subtle px-4 py-3">
            <h2
              id="vault-document-viewer-title"
              className="min-w-0 flex-1 truncate typo-heading-card text-slate-900 dark:text-slate-100"
            >
              {file.name}
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onDownload}
              className="shrink-0"
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              {t('vault.documentsManager.download')}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-slate-200"
              aria-label={t('vault.documentsManager.viewerCloseAria')}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-ep-surface">
            {isLoading ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                  {t('vault.documentsManager.viewerLoading')}
                </p>
              </div>
            ) : isDownloadOnly ? (
              <ViewerFallback
                title={t('vault.documentsManager.viewerDownloadOnlyTitle')}
                description={t('vault.documentsManager.viewerDownloadOnlyDescription')}
                onDownload={onDownload}
              />
            ) : error ? (
              <ViewerFallback
                title={t('vault.documentsManager.viewerErrorTitle')}
                description={error}
                onDownload={onDownload}
              />
            ) : viewerSource ? (
              <Suspense
                fallback={
                  <div className="flex h-full min-h-[16rem] items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                }
              >
                <div className="flex h-full min-h-[16rem] flex-col p-2 sm:p-4">
                  <OmniDocViewer
                    source={viewerSource}
                    pagination
                    initialViewMode="continuous"
                    height="100%"
                    className="min-h-0 flex-1"
                    style={{ minHeight: '100%' }}
                    errorFallback={(viewerError) => (
                      <ViewerFallback
                        title={t('vault.documentsManager.viewerErrorTitle')}
                        description={viewerError.message}
                        onDownload={onDownload}
                      />
                    )}
                  />
                </div>
              </Suspense>
            ) : (
              <ViewerFallback
                title={t('vault.documentsManager.viewerErrorTitle')}
                description={t('vault.documentsManager.viewOpenFailedError')}
                onDownload={onDownload}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ViewerFallback({
  title,
  description,
  onDownload,
}: {
  title: string
  description: string
  onDownload: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-ep-border-subtle bg-ep-surface text-ep-body-muted shadow-sm">
        <FileText className="h-7 w-7" aria-hidden />
      </div>
      <p className="typo-heading-card text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-2 max-w-md typo-body-sm text-slate-500 dark:text-slate-400">{description}</p>
      <Button type="button" variant="secondary" size="sm" className="mt-6" onClick={onDownload}>
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        {t('vault.documentsManager.download')}
      </Button>
    </div>
  )
}
