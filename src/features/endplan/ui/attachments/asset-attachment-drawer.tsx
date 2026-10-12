import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, DEFAULT_MODAL_BACKDROP_CLASSNAME } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { DOCUMENT_FILE_INPUT_ACCEPT } from '../../model/document-upload-policy'

type AssetAttachmentDrawerAttachment = {
  id: string
  name: string
  mimeType?: string | null
  originalSizeBytes: number
  uploadedAt?: string | null
}

type AssetAttachmentDrawerProps = {
  isOpen: boolean
  title: string
  hasAttachmentValue: boolean
  attachment?: AssetAttachmentDrawerAttachment | null
  isBusy?: boolean
  onClose: () => void
  onUpload: (file: File) => void
  onDownload?: () => void
  onDelete?: () => void
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function formatDate(timestamp?: string | null): string {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDocumentTypeLabel(
  attachment: AssetAttachmentDrawerAttachment | null | undefined,
  fallbackLabel: string,
  formatLabel: (type: string) => string,
): string {
  if (!attachment?.name) return fallbackLabel
  const extension = attachment.name.split('.').pop()?.trim()
  if (!extension) return fallbackLabel
  return formatLabel(extension.toUpperCase())
}

export function AssetAttachmentDrawer({
  isOpen,
  title,
  hasAttachmentValue,
  attachment,
  isBusy = false,
  onClose,
  onUpload,
  onDownload,
  onDelete,
}: AssetAttachmentDrawerProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasAttachment = !!attachment
  const hasAttachedValue = hasAttachment || hasAttachmentValue

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[80] overflow-hidden transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          DEFAULT_MODAL_BACKDROP_CLASSNAME,
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex h-full w-full max-w-[28rem] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-700 dark:bg-slate-950',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept={DOCUMENT_FILE_INPUT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (!file) return
            onUpload(file)
          }}
        />

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-ep-border-card">
          <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-slate-200"
            aria-label={t('vault.assets.attachments.closeDrawerAriaLabel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-xl bg-slate-100/90 px-6 py-8 text-center dark:bg-slate-900/70">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-ep-surface-panel dark:text-slate-300">
                <FileText className="h-7 w-7" />
              </div>
              <p className="typo-heading-card text-slate-900 dark:text-slate-100">
                {hasAttachment
                  ? attachment.name
                  : hasAttachmentValue
                    ? t('vault.assets.attachments.unavailableLabel')
                    : t('vault.assets.attachments.emptyLabel')}
              </p>
              <p className="mt-2 typo-body-sm text-slate-500 dark:text-slate-400">
                {hasAttachment
                  ? t('vault.assets.attachments.drawerPreviewLabel', {
                      type: getDocumentTypeLabel(
                        attachment,
                        t('vault.assets.attachments.documentTypeDefaultLabel'),
                        (type) =>
                          t('vault.assets.attachments.documentTypeFormat', {
                            type,
                          }),
                      ),
                    })
                  : t('vault.assets.attachments.drawerEmptyDescription')}
              </p>
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between border-b border-slate-200 py-4 dark:border-ep-border-card">
                <span className="typo-body text-slate-600 dark:text-slate-300">
                  {t('vault.assets.attachments.fileTypeLabel')}
                </span>
                <span className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {hasAttachment
                    ? getDocumentTypeLabel(
                        attachment,
                        t('vault.assets.attachments.documentTypeDefaultLabel'),
                        (type) => t('vault.assets.attachments.documentTypeFormat', { type }),
                      )
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 py-4 dark:border-ep-border-card">
                <span className="typo-body text-slate-600 dark:text-slate-300">
                  {t('vault.assets.attachments.sizeLabel')}
                </span>
                <span className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {hasAttachment ? formatBytes(attachment.originalSizeBytes) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="typo-body text-slate-600 dark:text-slate-300">
                  {t('vault.assets.attachments.uploadedLabel')}
                </span>
                <span className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {hasAttachment ? formatDate(attachment.uploadedAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 dark:border-ep-border-card">
          {hasAttachedValue ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onDownload}
                disabled={!hasAttachment || !onDownload || isBusy}
                fullWidth
              >
                {t('vault.assets.attachments.downloadAction')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="lg"
                onClick={onDelete}
                disabled={!onDelete || isBusy}
                fullWidth
              >
                {t('vault.assets.attachments.deleteAction')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={onClose} fullWidth>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                fullWidth
              >
                {t('vault.assets.attachments.attachAction')}
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  )
}
