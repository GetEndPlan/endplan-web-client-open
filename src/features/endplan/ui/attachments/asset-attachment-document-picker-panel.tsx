import { useRef } from 'react'
import { Circle, FileText, FolderPlus, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { useAssetAttachmentDocumentPicker } from '../../hooks/documents/use-asset-attachment-document-picker'
import type {
  AttachmentDocumentPickerFile,
  AttachmentDocumentPickerFolder,
} from '../../model/attachment-document-picker-tree'
import { DOCUMENT_FILE_INPUT_ACCEPT } from '../../model/document-upload-policy'
import { AttachmentDocumentFolderTree, AttachmentDocumentPickerFileRow } from '../documents/attachment-document-folder-tree'
import { DocumentsTextInputDialog } from '../documents/documents-dialogs'

export type AssetAttachmentDocumentPickerPanelProps = {
  isBusy?: boolean
  hasValue: boolean
  existingDocumentName?: string | null
  documentsFolders: AttachmentDocumentPickerFolder[]
  documentsFiles: AttachmentDocumentPickerFile[]
  canManageDocuments: boolean
  onLinkDocument: (file: AttachmentDocumentPickerFile) => void
  onCreateDocumentsFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (
    folderId: string,
    file: File,
  ) => Promise<{ id: string; name: string; folderId: string | null } | null>
  onDownloadCurrent?: () => void
  onDeleteCurrent?: () => void
  onCancel: () => void
  /**
   * modal: body/footer padding for use inside modal Card (with optional title row).
   * embedded: bordered block for inline use under a form section.
   */
  variant: 'modal' | 'embedded'
  /** Modal title row + close; omit for embedded. */
  title?: string
  onHeaderClose?: () => void
  className?: string
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function AssetAttachmentDocumentPickerPanel({
  isBusy = false,
  hasValue,
  existingDocumentName,
  documentsFolders,
  documentsFiles,
  canManageDocuments,
  onLinkDocument,
  onCreateDocumentsFolder,
  onUploadDocumentToFolder,
  onDownloadCurrent,
  onDeleteCurrent,
  onCancel,
  variant,
  title,
  onHeaderClose,
  className,
}: AssetAttachmentDocumentPickerPanelProps) {
  const { t } = useTranslation()
  const folderUploadInputRef = useRef<HTMLInputElement | null>(null)
  const folderUploadTargetRef = useRef<string | null>(null)
  const picker = useAssetAttachmentDocumentPicker({
    documentsFolders,
    documentsFiles,
    canManageDocuments,
    isBusy,
    folderUploadInputRef,
    folderUploadTargetRef,
    onCreateDocumentsFolder,
    onUploadDocumentToFolder,
    onLinkDocument,
  })

  const body = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={picker.searchQuery}
          onChange={(event) => picker.setSearchQuery(event.currentTarget.value)}
          placeholder={t('vault.assets.attachments.searchDocumentsPlaceholder')}
          className="ep-input-field py-2.5 pl-10 pr-3"
        />
      </div>

      <div className="max-h-[24rem] overflow-y-auto rounded-lg border border-slate-200 dark:border-ep-border-card dark:bg-ep-surface">
        {picker.normalizedSearchQuery ? (
          <div className="divide-y divide-slate-200 dark:divide-ep-border-card">
            {picker.searchResults.length === 0 ? (
              <p className="px-4 py-6 text-center typo-body-sm text-slate-500 dark:text-slate-400">
                {t('vault.assets.attachments.searchNoResults')}
              </p>
            ) : (
              picker.searchResults.map((file) => {
                const isSelected = picker.selectedFileId === file.id
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => picker.setSelectedFileId(file.id)}
                    className={cn(
                      'grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition',
                      isSelected
                        ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                        : 'text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-ep-primary-dark/40',
                    )}
                  >
                    <FileText
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected
                          ? 'text-ep-primary dark:text-ep-primary-muted'
                          : 'text-slate-400 dark:text-slate-500',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate typo-body-sm-emphasis">{file.name}</span>
                    <span
                      className={cn(
                        'typo-body-sm',
                        isSelected
                          ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
                          : 'text-slate-500 dark:text-slate-400',
                      )}
                    >
                      {formatBytes(file.originalSizeBytes)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full border',
                        isSelected
                          ? 'border-ep-primary bg-ep-primary-softer text-ep-primary dark:border-ep-primary-accent dark:bg-ep-primary/30 dark:text-ep-primary-muted'
                          : 'border-slate-400 text-transparent dark:border-slate-500',
                      )}
                    >
                      <Circle className="h-3.5 w-3.5 fill-current" />
                    </span>
                  </button>
                )
              })
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-ep-border-card">
            {picker.topLevelFolders.length === 0 && picker.rootFiles.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                  {t('vault.assets.attachments.folderHasNoFiles')}
                </p>
              </div>
            ) : (
              <>
                {picker.rootFiles.map((file) => (
                  <AttachmentDocumentPickerFileRow
                    key={file.id}
                    file={file}
                    depth={0}
                    selectedFileId={picker.selectedFileId}
                    onSelectFile={picker.setSelectedFileId}
                  />
                ))}
                <AttachmentDocumentFolderTree
                  parentKey={picker.rootParentKey}
                  depth={0}
                  foldersByParent={picker.foldersByParent}
                  directFilesByFolderId={picker.directFilesByFolderId}
                  expandedFolderIds={picker.expandedFolderIds}
                  selectedFileId={picker.selectedFileId}
                  canManageDocuments={picker.canManageDocuments}
                  isBusy={picker.isBusy}
                  t={t}
                  fileCountInSubtree={picker.fileCountInSubtree}
                  onFolderRowClick={picker.onFolderRowClick}
                  onSelectFile={picker.setSelectedFileId}
                  onUploadToFolder={picker.openFolderUploadPicker}
                />
              </>
            )}
            {picker.canManageDocuments ? (
              <button
                type="button"
                onClick={picker.startCreateFolder}
                disabled={picker.isBusy}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-ep-primary-dark/40"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 dark:border-ep-border-card dark:bg-ep-surface-subtle dark:text-slate-300">
                  <FolderPlus className="h-4 w-4" aria-hidden />
                </span>
                <span className="typo-body-sm-emphasis text-slate-800 dark:text-slate-100">
                  {t('vault.assets.attachments.newFolderAction')}
                </span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {!picker.canManageDocuments ? (
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('vault.assets.attachments.documentsOwnerOnlyHint')}
        </p>
      ) : null}
    </>
  )

  const footer = (
    <>
      {hasValue && (onDownloadCurrent || onDeleteCurrent) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="typo-body-sm text-slate-500 dark:text-slate-400">
            {existingDocumentName ?? t('vault.assets.attachments.unavailableLabel')}
          </span>
          {onDownloadCurrent && (
            <Button type="button" variant="secondary" size="sm" onClick={onDownloadCurrent} disabled={picker.isBusy}>
              {t('vault.assets.attachments.downloadAction')}
            </Button>
          )}
          {onDeleteCurrent && (
            <Button type="button" variant="danger" size="sm" onClick={onDeleteCurrent} disabled={picker.isBusy}>
              {t('vault.assets.attachments.deleteAction')}
            </Button>
          )}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={picker.isBusy}>
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={picker.handleLinkDocument} disabled={picker.isBusy || !picker.selectedLinkedFile}>
          {t('vault.assets.attachments.linkDocumentAction')}
        </Button>
      </div>
    </>
  )

  return (
    <>
      <input
        ref={folderUploadInputRef}
        type="file"
        accept={DOCUMENT_FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={picker.onFolderUploadInputChange}
      />

      {title && onHeaderClose ? (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-6 py-4 dark:border-ep-border-card dark:bg-ep-surface-subtle">
          <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onHeaderClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-200"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      {variant === 'modal' ? (
        <>
          <div className="space-y-4 px-6 py-5">{body}</div>
          <div className="border-t border-slate-200 px-6 py-4 dark:border-ep-border-card">{footer}</div>
        </>
      ) : (
        <div
          className={cn(
            'space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-ep-border-card dark:bg-ep-surface-subtle',
            className,
          )}
        >
          {body}
          <div className="border-t border-slate-200 pt-4 dark:border-ep-border-card">{footer}</div>
        </div>
      )}

      <DocumentsTextInputDialog
        open={!!picker.createFolderDialog}
        title={picker.createFolderDialogTitle}
        description={picker.createFolderDialogDescription}
        label={t('vault.documentsManager.folderNameLabel')}
        placeholder={t('vault.documentsManager.folderNamePlaceholder')}
        value={picker.createFolderDialog?.value ?? ''}
        submitLabel={t('vault.documentsManager.createFolderAction')}
        onChange={picker.setCreateFolderDialogValue}
        onClose={picker.closeCreateFolderDialog}
        onSubmit={() => void picker.submitCreateFolder()}
        isBusy={picker.isBusy}
      />
    </>
  )
}
