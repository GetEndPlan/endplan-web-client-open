import { useCallback } from 'react'
import type { TFunction } from 'i18next'
import type { DocumentsActionMenuItem } from '../../ui/documents/documents-action-menu'
import type { DecryptedVaultDocumentFile, DecryptedVaultDocumentFolder } from './use-vault-documents-page'

type UseVaultDocumentsCommandsArgs = {
  t: TFunction
  canWrite: boolean
  startCreateFolder: (parentFolderId: string | null) => void
  startRenameFolder: (folder: DecryptedVaultDocumentFolder) => void
  openDeleteFolderDialog: (folder: DecryptedVaultDocumentFolder) => void
  startRenameFile: (file: DecryptedVaultDocumentFile) => void
  openDeleteFileDialog: (file: DecryptedVaultDocumentFile) => void
  downloadFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
  viewDocumentFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
}

export function useVaultDocumentsCommands({
  t,
  canWrite,
  startCreateFolder,
  startRenameFolder,
  openDeleteFolderDialog,
  startRenameFile,
  openDeleteFileDialog,
  downloadFile,
  viewDocumentFile,
}: UseVaultDocumentsCommandsArgs) {
  const buildFolderMenuItems = useCallback(
    (folder: DecryptedVaultDocumentFolder): DocumentsActionMenuItem[] => {
      if (!canWrite) return []

      return [
        {
          key: 'new-subfolder',
          label: t('vault.documentsManager.newSubfolder'),
          onSelect: () => startCreateFolder(folder.id),
        },
        {
          key: 'rename-folder',
          label: t('vault.documentsManager.renameFolder'),
          onSelect: () => startRenameFolder(folder),
        },
        {
          key: 'delete-folder',
          label: t('vault.documentsManager.deleteFolder'),
          onSelect: () => openDeleteFolderDialog(folder),
          variant: 'danger',
        },
      ]
    },
    [canWrite, openDeleteFolderDialog, startCreateFolder, startRenameFolder, t],
  )

  const buildFileMenuItems = useCallback(
    (file: DecryptedVaultDocumentFile): DocumentsActionMenuItem[] => {
      const items: DocumentsActionMenuItem[] = [
        {
          key: 'view',
          label: t('vault.documentsManager.selectionToolbarView'),
          onSelect: () => void viewDocumentFile(file),
        },
        {
          key: 'download',
          label: t('vault.documentsManager.download'),
          onSelect: () => void downloadFile(file),
        },
      ]
      if (!canWrite) return items

      items.push(
        {
          key: 'rename',
          label: t('vault.documentsManager.renameDocument'),
          onSelect: () => startRenameFile(file),
        },
        {
          key: 'delete',
          label: t('vault.documentsManager.deleteDocument'),
          onSelect: () => openDeleteFileDialog(file),
          variant: 'danger',
        },
      )
      return items
    },
    [canWrite, downloadFile, openDeleteFileDialog, startRenameFile, t, viewDocumentFile],
  )

  return { buildFolderMenuItems, buildFileMenuItems }
}
