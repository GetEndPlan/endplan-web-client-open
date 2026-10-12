import { useTranslation } from 'react-i18next'
import type {
  DecryptedVaultDocumentFile,
  DecryptedVaultDocumentFolder,
} from '../../hooks/documents/use-vault-documents-page'
import type { DocumentsActionMenuItem } from './documents-action-menu'
import { DocumentsDriveFolderList } from './documents-drive-folder-list'
import { DocumentsDriveListTable, type DocumentsDriveSelection } from './documents-drive-list-table'
import type { DocumentsDriveViewMode } from '../../model/vault-documents-tree'
import { DocumentsWorkspaceEmptyState } from './documents-workspace-empty-state'
import { DocumentsFileList } from './documents-file-list'
import { documentUploadConstraintParams } from './document-upload-constraints'

const DRIVE_ITEM_GRID_CLASS =
  'grid grid-cols-2 justify-start gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(160px,160px))]'

export type DocumentsDriveBodyProps = {
  hasFolders: boolean
  visibleFiles: DecryptedVaultDocumentFile[]
  driveFolders: DecryptedVaultDocumentFolder[]
  driveFiles: DecryptedVaultDocumentFile[]
  showNoSearchResults: boolean
  selectedFolder: DecryptedVaultDocumentFolder | null
  viewMode: DocumentsDriveViewMode
  canWrite: boolean
  isBusy: boolean
  isUploading: boolean
  canUploadToSelectedFolder: boolean
  canCreateFolder: boolean
  directChildItemCountByFolderId: Map<string, number>
  setSelectedFolderId: (folderId: string | null) => void
  buildFolderMenuItems: (folder: DecryptedVaultDocumentFolder) => DocumentsActionMenuItem[]
  buildFileMenuItems: (file: DecryptedVaultDocumentFile) => DocumentsActionMenuItem[]
  openFilePicker: () => void
  startCreateFolder: (parentFolderId: string | null) => void
  driveSelection?: DocumentsDriveSelection | null
  maxFileSizeBytes: number
}

export function DocumentsDriveBody({
  hasFolders,
  visibleFiles,
  driveFolders,
  driveFiles,
  showNoSearchResults,
  selectedFolder,
  viewMode,
  canWrite,
  isBusy,
  isUploading,
  canUploadToSelectedFolder,
  canCreateFolder,
  directChildItemCountByFolderId,
  setSelectedFolderId,
  buildFolderMenuItems,
  buildFileMenuItems,
  openFilePicker,
  startCreateFolder,
  driveSelection = null,
  maxFileSizeBytes,
}: DocumentsDriveBodyProps) {
  const { t } = useTranslation()
  const constraintParams = documentUploadConstraintParams(maxFileSizeBytes)
  const noFilesYetDescription = t('vault.documentsManager.noFilesYetDescription', constraintParams)

  if (!hasFolders && visibleFiles.length === 0) {
    return (
      <DocumentsWorkspaceEmptyState
        variant="workspace"
        canWrite={canWrite}
        isBusy={isBusy}
        isUploading={isUploading}
        canUploadToSelectedFolder={canUploadToSelectedFolder}
        canCreateFolder={canCreateFolder}
        maxFileSizeBytes={maxFileSizeBytes}
        onUploadFiles={openFilePicker}
        onCreateFolder={() => startCreateFolder(null)}
      />
    )
  }

  if (showNoSearchResults) {
    return (
      <div className="py-12 text-center">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('vault.documentsManager.driveNoSearchResults')}
        </p>
      </div>
    )
  }

  const showFolderList = driveFolders.length > 0
  const showFiles = driveFiles.length > 0
  const mergeLists = showFolderList && showFiles

  const renderFolderList = (mergeWithSibling: boolean) => (
    <DocumentsDriveFolderList
      folders={driveFolders}
      itemCountByFolderId={directChildItemCountByFolderId}
      layout={viewMode}
      mergeWithSibling={mergeWithSibling}
      canWrite={canWrite}
      isBusy={isBusy}
      onOpenFolder={setSelectedFolderId}
      buildFolderMenuItems={buildFolderMenuItems}
      folderActionsLabel={t('vault.documentsManager.folderActions')}
      driveSelection={driveSelection}
    />
  )

  const renderFileList = (mergeWithSibling: boolean) => (
    <DocumentsFileList
      files={driveFiles}
      canWrite={canWrite}
      layout={viewMode}
      mergeWithSibling={mergeWithSibling}
      buildFileMenuItems={buildFileMenuItems}
      driveSelection={driveSelection}
    />
  )

  const mergedFoldersAndFiles =
    mergeLists && viewMode === 'list' ? (
      <DocumentsDriveListTable
        folders={driveFolders}
        files={driveFiles}
        canWrite={canWrite}
        onOpenFolder={setSelectedFolderId}
        buildFolderMenuItems={buildFolderMenuItems}
        buildFileMenuItems={buildFileMenuItems}
        folderActionsLabel={t('vault.documentsManager.folderActions')}
        fileActionsLabel={t('vault.documentsManager.documentActions')}
        driveSelection={driveSelection}
      />
    ) : (
      <div className={DRIVE_ITEM_GRID_CLASS}>
        {renderFolderList(true)}
        {renderFileList(true)}
      </div>
    )

  const fileListOnly = showFiles ? (
    <div className="space-y-3">
      {renderFileList(false)}
    </div>
  ) : null

  if (!selectedFolder) {
    if (showFiles) {
      if (showFolderList) {
        return mergedFoldersAndFiles
      }
      return fileListOnly
    }

    if (showFolderList) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {renderFolderList(false)}
          {canWrite ? (
            <p className="typo-body-sm text-slate-500 dark:text-slate-400">
              {t('vault.documentsManager.noFilesYetDescription', constraintParams)}
            </p>
          ) : null}
        </div>
      )
    }

    return (
      <DocumentsWorkspaceEmptyState
        variant="workspace"
        canWrite={canWrite}
        isBusy={isBusy}
        isUploading={isUploading}
        canUploadToSelectedFolder={canUploadToSelectedFolder}
        canCreateFolder={canCreateFolder}
        maxFileSizeBytes={maxFileSizeBytes}
        onUploadFiles={openFilePicker}
        onCreateFolder={() => startCreateFolder(null)}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {mergeLists ? (
        mergedFoldersAndFiles
      ) : (
        <>
          {showFolderList ? renderFolderList(false) : null}
          {showFiles ? (
            fileListOnly
          ) : showFolderList ? (
            <p className="typo-body-sm text-slate-500 dark:text-slate-400">
              {canWrite
                ? noFilesYetDescription
                : t('vault.documentsManager.emptyFolderDescription')}
            </p>
          ) : (
            <DocumentsWorkspaceEmptyState
              variant="folder"
              canWrite={canWrite}
              isBusy={isBusy}
              isUploading={isUploading}
              canUploadToSelectedFolder={canUploadToSelectedFolder}
              canCreateFolder={canCreateFolder}
              maxFileSizeBytes={maxFileSizeBytes}
              onUploadFiles={openFilePicker}
              onCreateFolder={() => startCreateFolder(selectedFolder.id)}
            />
          )}
        </>
      )}
    </div>
  )
}
