import { FolderPlus, Info, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { DocumentsUploadDropdown } from './documents-upload-dropdown'
import { documentUploadConstraintParams } from './document-upload-constraints'

type DocumentsWorkspaceEmptyStateProps = {
  /** `workspace`: no folders/files in vault. `folder`: open folder has no items. */
  variant?: 'workspace' | 'folder'
  canWrite: boolean
  isBusy: boolean
  isUploading: boolean
  canUploadToSelectedFolder: boolean
  canCreateFolder?: boolean
  maxFileSizeBytes: number
  onUploadFiles: () => void
  /** Create folder at root (`null`) or subfolder (caller closes over parent id). */
  onCreateFolder: () => void
}

function DocumentsWorkspaceEmptyIllustration() {
  return (
    <div className="relative mx-auto mb-8 h-[100px] w-[128px]" aria-hidden>
      <div className="absolute left-0 top-6 h-[72px] w-14 rounded-md border-2 border-slate-300 bg-white shadow-sm dark:border-ep-border-card dark:bg-ep-surface-panel">
        <div className="mt-3 space-y-1.5 px-2.5">
          <div className="h-1 rounded-full bg-slate-200 dark:bg-ep-border" />
          <div className="h-1 rounded-full bg-slate-200 dark:bg-ep-border" />
          <div className="h-1 w-4/5 rounded-full bg-slate-200 dark:bg-ep-border" />
        </div>
      </div>
      <div className="absolute bottom-2 left-8 h-[52px] w-16 rounded-md border-2 border-ep-primary-accent bg-white dark:border-ep-primary dark:bg-ep-surface-panel">
        <div className="absolute -top-2 left-0 h-2.5 w-7 rounded-t border-2 border-b-0 border-ep-primary-accent dark:border-ep-primary" />
      </div>
      <div className="absolute -right-0.5 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-ep-primary text-white shadow-md dark:bg-ep-primary">
        <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </div>
    </div>
  )
}

/** Empty vault or empty selected folder — shared marketing layout. */
export function DocumentsWorkspaceEmptyState({
  variant = 'workspace',
  canWrite,
  isBusy,
  isUploading,
  canUploadToSelectedFolder,
  canCreateFolder = true,
  maxFileSizeBytes,
  onUploadFiles,
  onCreateFolder,
}: DocumentsWorkspaceEmptyStateProps) {
  const { t } = useTranslation()
  const constraintParams = documentUploadConstraintParams(maxFileSizeBytes)

  const titleKey =
    !canWrite && variant === 'folder'
      ? 'vault.documentsManager.emptyFolderTitle'
      : 'vault.documentsManager.emptyWorkspaceTitle'

  const description = (() => {
    if (!canWrite) {
      return variant === 'folder'
        ? t('vault.documentsManager.emptyFolderDescription')
        : t('vault.documentsManager.readOnlyHint')
    }
    return variant === 'folder'
      ? t('vault.documentsManager.folderOnlyUploadDescription', constraintParams)
      : t('vault.documentsManager.emptyWorkspaceDescription', constraintParams)
  })()

  const dragHintKey = canUploadToSelectedFolder
    ? 'vault.documentsManager.emptyWorkspaceDragHint'
    : 'vault.documentsManager.emptyWorkspaceDragHintBeforeFolder'

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
        <DocumentsWorkspaceEmptyIllustration />

        <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{t(titleKey)}</h3>
        <p className="mx-auto mt-3 max-w-lg typo-body-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>

        {canWrite ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <DocumentsUploadDropdown
              disabled={isBusy}
              isUploading={isUploading}
              onUploadFiles={onUploadFiles}
              className={!canUploadToSelectedFolder ? 'opacity-60' : undefined}
            />
            <button
              type="button"
              onClick={onCreateFolder}
              disabled={isBusy}
              className={cn(
                'typo-body-sm-strong inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-ep-primary-accent ring-1 ring-inset ring-ep-primary-soft transition hover:bg-ep-primary-softer disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ep-surface-panel dark:text-ep-primary-accent dark:ring-ep-primary/30 dark:hover:bg-ep-primary-dark/70',
                !canCreateFolder && 'opacity-60',
              )}
            >
              <FolderPlus className="h-[18px] w-[18px] shrink-0 text-ep-primary dark:text-ep-primary-accent" aria-hidden />
              {t('vault.documentsManager.driveCreateNewFolder')}
            </button>
          </div>
        ) : null}

        {canWrite ? (
          <p className="mx-auto mt-8 flex max-w-lg items-start justify-center gap-2 typo-caption text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
            <span>{t(dragHintKey)}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
