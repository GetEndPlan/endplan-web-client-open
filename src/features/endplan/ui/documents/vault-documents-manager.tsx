import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { EndPlanIcon } from '@/shared/ui'
import type {
  DecryptedVaultDocumentFile,
  DecryptedVaultDocumentFolder,
} from '../../hooks/documents/use-vault-documents-page'
import { useDocumentsDriveViewState } from '../../hooks/documents/use-documents-drive-view-state'
import { useVaultDocumentsCommands } from '../../hooks/documents/use-vault-documents-commands'
import { useVaultDocumentsManager } from '../../hooks/documents/use-vault-documents-manager'
import { DOCUMENT_FILE_INPUT_ACCEPT } from '../../model/document-upload-policy'
import { BASIC_TIER_DOCUMENTS_FILE_SIZE_MAX_BYTES } from '../../model/vault-documents-plan-guards'
import { documentUploadConstraintParams } from './document-upload-constraints'
import { DOCUMENT_SUGGESTIONS, type DocumentSuggestionId } from '../../model/document-suggestions'
import {
  DocumentsConfirmDialog,
  DocumentsFolderDeleteOptionsDialog,
  DocumentsSelectFolderDialog,
  DocumentsTextInputDialog,
} from './documents-dialogs'
import { DocumentsDriveBreadcrumbs } from './documents-drive-breadcrumbs'
import { DocumentsDriveBody } from './documents-drive-body'
import { DocumentsDriveToolbar, type DocumentsDriveToolbarSelection } from './documents-drive-toolbar'
import { DocumentsUploadDropdown } from './documents-upload-dropdown'
import {
  VaultDocumentViewerModal,
} from './vault-document-viewer-modal'
import type { VaultDocumentViewerState } from '../../hooks/documents/use-vault-document-viewer'
import {
  VaultCategoryQuotaLimitModal,
  type VaultPlanQuotaLimitKind,
} from '../section/vault-category-quota-limit-modal'
import { VaultSuggestionTile, VaultSuggestionsPanel } from '../suggestions'

type VaultDocumentsManagerProps = {
  canWrite: boolean
  canCreateFolder: boolean
  canUploadDocuments: boolean
  isBusy: boolean
  isUploading: boolean
  foldersByParent: Record<string, DecryptedVaultDocumentFolder[]>
  files: DecryptedVaultDocumentFile[]
  visibleFiles: DecryptedVaultDocumentFile[]
  selectedFolderId: string | null
  selectedFolder: DecryptedVaultDocumentFolder | null
  breadcrumbs: DecryptedVaultDocumentFolder[]
  setSelectedFolderId: (folderId: string | null) => void
  createFolder: (name: string, parentFolderId?: string | null) => Promise<boolean>
  renameFolder: (folderId: string, nextName: string) => Promise<boolean>
  renameFile: (fileId: string, nextName: string) => Promise<boolean>
  moveFilesToFolder: (fileIds: string[], destinationFolderId: string) => Promise<boolean>
  deleteFolder: (folderId: string) => Promise<boolean>
  uploadFiles: (files: FileList | File[], folderId?: string | null) => Promise<boolean>
  downloadFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
  viewDocumentFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
  deleteFile: (fileId: string) => Promise<boolean>
  documentViewer: VaultDocumentViewerState<DecryptedVaultDocumentFile>
  maxFileSizeBytes?: number
}

export function VaultDocumentsManager({
  canWrite,
  canCreateFolder,
  canUploadDocuments,
  isBusy,
  isUploading,
  foldersByParent,
  files,
  visibleFiles,
  selectedFolderId,
  selectedFolder,
  breadcrumbs,
  setSelectedFolderId,
  createFolder,
  renameFolder,
  renameFile,
  moveFilesToFolder,
  deleteFolder,
  uploadFiles,
  downloadFile,
  viewDocumentFile,
  deleteFile,
  documentViewer,
  maxFileSizeBytes = BASIC_TIER_DOCUMENTS_FILE_SIZE_MAX_BYTES,
}: VaultDocumentsManagerProps) {
  const { t } = useTranslation()
  const uploadConstraintParams = documentUploadConstraintParams(maxFileSizeBytes)
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const [quotaLimitModalKind, setQuotaLimitModalKind] = useState<
    Extract<VaultPlanQuotaLimitKind, 'document_file' | 'document_folder'> | null
  >(null)
  const [completedSuggestionIds, setCompletedSuggestionIds] = useState(
    () => new Set<DocumentSuggestionId>(),
  )

  const markSuggestionDone = (suggestionId: DocumentSuggestionId) => {
    setCompletedSuggestionIds((current) => {
      if (current.has(suggestionId)) return current
      const next = new Set(current)
      next.add(suggestionId)
      return next
    })
  }
  const {
    viewMode,
    setViewMode,
    sortCreatedDesc,
    setSortCreatedDesc,
    searchQuery,
    setSearchQuery,
    driveFolders,
    driveFiles,
    showNoSearchResults,
  } = useDocumentsDriveViewState({
    foldersByParent,
    visibleFiles,
    selectedFolderId,
    files,
  })

  const {
    fileInputRef,
    textDialog,
    confirmDialog,
    deleteFolderOptionsDialog,
    moveFolderFilesDialog,
    directChildItemCountByFolderId,
    hasFolders,
    canUploadToSelectedFolder,
    isDropZoneActive,
    openFilePicker,
    onFilesSelected,
    startCreateFolder,
    startRenameFolder,
    startRenameFile,
    openDeleteFolderDialog,
    openDeleteFileDialog,
    closeTextDialog,
    setTextDialogValue,
    submitTextDialog,
    closeConfirmDialog,
    submitConfirmDialog,
    closeDeleteFolderOptionsDialog,
    openMoveFolderFilesDialog,
    submitDeleteFolderWithFiles,
    closeMoveFolderFilesDialog,
    setMoveFolderDestination,
    submitMoveFolderFilesDialog,
    handleWorkspaceDragOver,
    handleWorkspaceDragLeave,
    handleWorkspaceDrop,
    textDialogTitle,
    textDialogDescription,
    confirmDialogTitle,
    confirmDialogDescription,
    pickerSelection,
    toggleFileSelected,
    toggleFolderSelected,
    toggleSelectAllVisible,
    openDeleteSelectionDialog,
    handleBulkDownload,
    handleViewSelected,
    isSelectionActionBusy,
  } = useVaultDocumentsManager({
    canWrite,
    canCreateFolder,
    canUploadDocuments,
    isBusy,
    files,
    driveFiles,
    driveFolders,
    foldersByParent,
    selectedFolderId,
    selectedFolder,
    breadcrumbs,
    createFolder,
    renameFolder,
    renameFile,
    moveFilesToFolder,
    deleteFolder,
    deleteFile,
    uploadFiles,
    downloadFile,
    viewDocumentFile,
    onQuotaExhausted: setQuotaLimitModalKind,
  })

  const combinedBusy = isBusy || isSelectionActionBusy

  const driveSelection = useMemo(() => {
    if (driveFiles.length + driveFolders.length === 0) return null
    return {
      selectedFileIds: pickerSelection.fileIds,
      selectedFolderIds: pickerSelection.folderIds,
      onToggleFile: toggleFileSelected,
      onToggleFolder: toggleFolderSelected,
      onToggleSelectAll: toggleSelectAllVisible,
    }
  }, [
    driveFiles.length,
    driveFolders.length,
    pickerSelection.fileIds,
    pickerSelection.folderIds,
    toggleFileSelected,
    toggleFolderSelected,
    toggleSelectAllVisible,
  ])

  const driveToolbarSelection = useMemo((): DocumentsDriveToolbarSelection | null => {
    const selectableCount = driveFiles.length + driveFolders.length
    if (selectableCount === 0) return null
    const allSelected =
      driveFiles.every((f) => pickerSelection.fileIds.has(f.id)) &&
      driveFolders.every((f) => pickerSelection.folderIds.has(f.id))
    const anySelected =
      driveFiles.some((f) => pickerSelection.fileIds.has(f.id)) ||
      driveFolders.some((f) => pickerSelection.folderIds.has(f.id))
    const selectedCount = pickerSelection.fileIds.size + pickerSelection.folderIds.size
    const hasSelectedFiles = driveFiles.some((f) => pickerSelection.fileIds.has(f.id))
    const canViewSingleFile =
      pickerSelection.folderIds.size === 0 &&
      pickerSelection.fileIds.size === 1 &&
      driveFiles.some((f) => pickerSelection.fileIds.has(f.id))

    return {
      selectableCount,
      allSelected,
      someSelected: anySelected && !allSelected,
      selectedCount,
      hasSelectedFiles,
      canViewSingleFile,
      onToggleSelectAll: toggleSelectAllVisible,
      onDownload: handleBulkDownload,
      onView: handleViewSelected,
      onDelete: openDeleteSelectionDialog,
    }
  }, [
    driveFiles,
    driveFolders,
    handleBulkDownload,
    handleViewSelected,
    openDeleteSelectionDialog,
    pickerSelection.fileIds,
    pickerSelection.folderIds,
    toggleSelectAllVisible,
  ])

  const { buildFolderMenuItems, buildFileMenuItems } = useVaultDocumentsCommands({
    t,
    canWrite,
    startCreateFolder,
    startRenameFolder,
    openDeleteFolderDialog,
    startRenameFile,
    openDeleteFileDialog,
    downloadFile,
    viewDocumentFile,
  })

  const createFolderParentId = selectedFolderId

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <DocumentsDriveBreadcrumbs
            rootLabel={t('vault.documentsManager.driveRootBreadcrumbLabel', { defaultValue: 'My files' })}
            breadcrumbs={breadcrumbs}
            selectedFolderId={selectedFolderId}
            onNavigate={setSelectedFolderId}
          />

          {canWrite ? (
            <div className="header-actions flex w-full shrink-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
              <button
                type="button"
                onClick={() => startCreateFolder(createFolderParentId)}
                disabled={combinedBusy}
                className={cn(
                  'typo-body-sm-strong inline-flex items-center gap-1.5 rounded-[7px] bg-white px-4 py-2.5 text-ep-primary-accent ring-1 ring-inset ring-ep-primary-soft transition hover:bg-ep-primary-softer disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ep-surface-subtle dark:text-ep-primary-accent dark:ring-ep-primary/30 dark:hover:bg-ep-primary-dark/50',
                  !canCreateFolder && 'opacity-60',
                )}
              >
                <FolderPlus className="h-[18px] w-[18px] shrink-0 text-ep-primary dark:text-ep-primary-accent" aria-hidden />
                {t('vault.documentsManager.driveCreateNewFolder')}
              </button>
              <DocumentsUploadDropdown
                disabled={combinedBusy}
                isUploading={isUploading}
                onUploadFiles={openFilePicker}
                className={!canUploadDocuments ? 'opacity-60' : undefined}
              />
            </div>
          ) : null}
        </div>

        {!suggestionsDismissed ? (
          <VaultSuggestionsPanel
            title={t('vault.documentsManager.suggestions.title')}
            subtitle={t('vault.documentsManager.suggestions.subtitle')}
            dismissLabel={t('vault.documentsManager.suggestions.dismiss')}
            onDismiss={() => setSuggestionsDismissed(true)}
            className="shrink-0"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_SUGGESTIONS.map((suggestion) => {
                const done = completedSuggestionIds.has(suggestion.id)
                return (
                  <VaultSuggestionTile
                    key={suggestion.id}
                    title={t(`vault.documentsManager.suggestions.items.${suggestion.id}`)}
                    metaLabel={
                      done
                        ? undefined
                        : t('vault.documentsManager.suggestions.toConsider')
                    }
                    icon={<EndPlanIcon name={suggestion.icon} size={24} className="size-5" />}
                    added={done}
                    action="plus"
                    plusVariant="circle"
                    ariaLabel={t('vault.documentsManager.suggestions.markDone', {
                      name: t(`vault.documentsManager.suggestions.items.${suggestion.id}`),
                    })}
                    onSelect={() => markSuggestionDone(suggestion.id)}
                  />
                )
              })}
            </div>
          </VaultSuggestionsPanel>
        ) : null}

        <section
          className="relative flex min-h-0 min-w-0 flex-1 flex-col"
          onDragOver={handleWorkspaceDragOver}
          onDragLeave={handleWorkspaceDragLeave}
          onDrop={(event) => void handleWorkspaceDrop(event)}
        >
          <DocumentsDriveToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortCreatedDesc={sortCreatedDesc}
            onToggleSortOrder={() => setSortCreatedDesc((current) => !current)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            disabled={combinedBusy}
            canDelete={canWrite}
            selection={driveToolbarSelection}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 pt-1">
            {isDropZoneActive && canUploadToSelectedFolder ? (
              <div className="pointer-events-none absolute inset-0 z-10 m-1 flex items-center justify-center rounded-lg border-2 border-dashed border-ep-primary bg-ep-primary-softer/90 dark:border-ep-primary-accent dark:bg-slate-900/85">
                <div className="text-center">
                  <p className="typo-heading-subcard text-ep-primary-accent dark:text-ep-primary-muted">
                    {t('vault.documentsManager.uploadTitle', {
                      folder:
                        selectedFolder?.name ??
                        t('vault.documentsManager.driveRootBreadcrumbLabel', { defaultValue: 'My files' }),
                    })}
                  </p>
                  <p className="mt-2 max-w-lg typo-body-sm text-ep-primary-accent/80 dark:text-ep-primary-muted/80">
                    {t('vault.documentsManager.uploadDescription', uploadConstraintParams)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col">
              <DocumentsDriveBody
                hasFolders={hasFolders}
                visibleFiles={visibleFiles}
                driveFolders={driveFolders}
                driveFiles={driveFiles}
                showNoSearchResults={showNoSearchResults}
                selectedFolder={selectedFolder}
                viewMode={viewMode}
                canWrite={canWrite}
                isBusy={combinedBusy}
                isUploading={isUploading}
                canUploadToSelectedFolder={canUploadToSelectedFolder}
                canCreateFolder={canCreateFolder}
                directChildItemCountByFolderId={directChildItemCountByFolderId}
                setSelectedFolderId={setSelectedFolderId}
                buildFolderMenuItems={buildFolderMenuItems}
                buildFileMenuItems={buildFileMenuItems}
                openFilePicker={openFilePicker}
                startCreateFolder={startCreateFolder}
                driveSelection={driveSelection}
                maxFileSizeBytes={maxFileSizeBytes}
              />
            </div>
          </div>
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept={DOCUMENT_FILE_INPUT_ACCEPT}
        onChange={onFilesSelected}
      />

      <DocumentsTextInputDialog
        open={!!textDialog}
        title={textDialogTitle}
        description={textDialogDescription}
        label={
          textDialog?.kind === 'rename-file'
            ? t('vault.documentsManager.documentNameLabel')
            : t('vault.documentsManager.folderNameLabel')
        }
        placeholder={
          textDialog?.kind === 'rename-file'
            ? t('vault.documentsManager.documentNamePlaceholder')
            : t('vault.documentsManager.folderNamePlaceholder')
        }
        value={textDialog?.value ?? ''}
        submitLabel={
          textDialog?.kind === 'create-folder'
            ? t('vault.documentsManager.createFolderAction')
            : t('vault.documentsManager.saveNameAction')
        }
        onChange={(value) => {
          setTextDialogValue(value)
        }}
        onClose={closeTextDialog}
        onSubmit={() => void submitTextDialog()}
        isBusy={combinedBusy}
      />

      {confirmDialog ? (
        <DocumentsConfirmDialog
          open
          title={confirmDialogTitle}
          description={confirmDialogDescription}
          confirmLabel={
            confirmDialog.kind === 'delete-folder'
              ? t('vault.documentsManager.deleteFolder')
              : confirmDialog.kind === 'delete-drive-selection'
                ? t('vault.documentsManager.deleteDriveSelectionConfirm')
                : t('vault.documentsManager.deleteDocument')
          }
          onConfirm={() => void submitConfirmDialog()}
          onClose={closeConfirmDialog}
          isBusy={combinedBusy}
        />
      ) : null}

      {deleteFolderOptionsDialog ? (
        <DocumentsFolderDeleteOptionsDialog
          open
          title={t('vault.documentsManager.deleteFolderWithFilesTitle')}
          description={t('vault.documentsManager.deleteFolderWithFilesDescription', {
            name: deleteFolderOptionsDialog.folder.name,
            count: deleteFolderOptionsDialog.affectedFileCount,
          })}
          moveLabel={t('vault.documentsManager.moveFilesThenDeleteAction')}
          moveDescription=""
          moveDisabled={deleteFolderOptionsDialog.destinationOptions.length === 0}
          moveDisabledReason={
            deleteFolderOptionsDialog.destinationOptions.length === 0
              ? t('vault.documentsManager.noMoveDestinationDescription')
              : undefined
          }
          deleteLabel={t('vault.documentsManager.deleteFolderAndFilesAction', {
            count: deleteFolderOptionsDialog.affectedFileCount,
          })}
          onMove={openMoveFolderFilesDialog}
          onDelete={() => void submitDeleteFolderWithFiles()}
          onClose={closeDeleteFolderOptionsDialog}
          isBusy={combinedBusy}
        />
      ) : null}

      {moveFolderFilesDialog ? (
        <DocumentsSelectFolderDialog
          open
          title={t('vault.documentsManager.moveFilesDialogTitle')}
          description={t('vault.documentsManager.moveFilesDialogDescription', {
            name: moveFolderFilesDialog.folder.name,
            count: moveFolderFilesDialog.affectedFileCount,
          })}
          label={t('vault.documentsManager.moveDestinationFolderLabel')}
          options={moveFolderFilesDialog.destinationOptions}
          value={moveFolderFilesDialog.destinationFolderId}
          submitLabel={t('vault.documentsManager.moveFilesAction')}
          onChange={setMoveFolderDestination}
          onClose={closeMoveFolderFilesDialog}
          onSubmit={() => void submitMoveFolderFilesDialog()}
          isBusy={combinedBusy}
          requireDeleteConfirmation
        />
      ) : null}

      <VaultDocumentViewerModal
        isOpen={documentViewer.isOpen}
        file={documentViewer.file}
        blob={documentViewer.blob}
        isLoading={documentViewer.isLoading}
        isDownloadOnly={documentViewer.isDownloadOnly}
        error={documentViewer.error}
        onClose={documentViewer.onClose}
        onDownload={documentViewer.onDownload}
      />

      <VaultCategoryQuotaLimitModal
        isOpen={quotaLimitModalKind != null}
        kind={quotaLimitModalKind ?? 'document_file'}
        onClose={() => setQuotaLimitModalKind(null)}
      />
    </>
  )
}
