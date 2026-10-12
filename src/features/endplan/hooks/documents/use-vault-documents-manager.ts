import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEventHandler, DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  buildDeleteFolderMoveDestinationOptions,
  collectSubtreeFolderIds,
  getFileIdsInFolderSubtree,
} from '../../model/vault-documents-tree'
import type {
  DecryptedVaultDocumentFile,
  DecryptedVaultDocumentFolder,
} from './use-vault-documents-page'

type TextDialogState =
  | {
      kind: 'create-folder'
      parentFolderId: string | null
      value: string
    }
  | {
      kind: 'rename-folder'
      folder: DecryptedVaultDocumentFolder
      value: string
    }
  | {
      kind: 'rename-file'
      file: DecryptedVaultDocumentFile
      value: string
    }
  | null

type ConfirmDialogState =
  | {
      kind: 'delete-folder'
      folder: DecryptedVaultDocumentFolder
    }
  | {
      kind: 'delete-file'
      file: DecryptedVaultDocumentFile
    }
  | {
      kind: 'delete-drive-selection'
      files: DecryptedVaultDocumentFile[]
      emptyFolders: DecryptedVaultDocumentFolder[]
      blockedFolderNames: string[]
    }
  | null

type FolderMoveOption = {
  id: string
  label: string
}

type DeleteFolderOptionsDialogState = {
  folder: DecryptedVaultDocumentFolder
  affectedFileIds: string[]
  affectedFileCount: number
  destinationOptions: FolderMoveOption[]
} | null

type MoveFolderFilesDialogState = {
  folder: DecryptedVaultDocumentFolder
  affectedFileIds: string[]
  affectedFileCount: number
  destinationOptions: FolderMoveOption[]
  destinationFolderId: string
} | null

type UseVaultDocumentsManagerArgs = {
  canWrite: boolean
  canCreateFolder: boolean
  canUploadDocuments: boolean
  isBusy: boolean
  files: DecryptedVaultDocumentFile[]
  /** Current drive file list (folder + search); used to prune selection and “select all”. */
  driveFiles: DecryptedVaultDocumentFile[]
  /** Current drive folders (same scope as driveFiles). */
  driveFolders: DecryptedVaultDocumentFolder[]
  foldersByParent: Record<string, DecryptedVaultDocumentFolder[]>
  selectedFolderId: string | null
  selectedFolder: DecryptedVaultDocumentFolder | null
  breadcrumbs: DecryptedVaultDocumentFolder[]
  createFolder: (name: string, parentFolderId?: string | null) => Promise<boolean>
  renameFolder: (folderId: string, nextName: string) => Promise<boolean>
  renameFile: (fileId: string, nextName: string) => Promise<boolean>
  moveFilesToFolder: (fileIds: string[], destinationFolderId: string) => Promise<boolean>
  deleteFolder: (folderId: string) => Promise<boolean>
  deleteFile: (fileId: string) => Promise<boolean>
  uploadFiles: (files: FileList | File[], folderId?: string | null) => Promise<boolean>
  downloadFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
  viewDocumentFile: (file: DecryptedVaultDocumentFile) => Promise<boolean>
  onQuotaExhausted?: (kind: 'document_file' | 'document_folder') => void
}

import { ROOT_FOLDER_KEY } from '../../model/vault-documents-tree'

function areSetsEqual<T>(left: Set<T>, right: Set<T>): boolean {
  if (left.size !== right.size) return false
  for (const value of left) {
    if (!right.has(value)) return false
  }
  return true
}

type PickerSelection = {
  fileIds: Set<string>
  folderIds: Set<string>
}

function emptyPickerSelection(): PickerSelection {
  return { fileIds: new Set(), folderIds: new Set() }
}

export function useVaultDocumentsManager({
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
  onQuotaExhausted,
}: UseVaultDocumentsManagerArgs) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasInitializedExpandedFoldersRef = useRef(false)
  const [textDialog, setTextDialog] = useState<TextDialogState>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null)
  const [deleteFolderOptionsDialog, setDeleteFolderOptionsDialog] =
    useState<DeleteFolderOptionsDialogState>(null)
  const [moveFolderFilesDialog, setMoveFolderFilesDialog] =
    useState<MoveFolderFilesDialogState>(null)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())
  const [isDropZoneActive, setIsDropZoneActive] = useState(false)
  const [pickerSelection, setPickerSelection] = useState<PickerSelection>(() => emptyPickerSelection())
  const [isSelectionActionBusy, setIsSelectionActionBusy] = useState(false)

  const driveFileIdSet = useMemo(() => new Set(driveFiles.map((f) => f.id)), [driveFiles])
  const driveFolderIdSet = useMemo(() => new Set(driveFolders.map((f) => f.id)), [driveFolders])

  const topLevelFolders = useMemo(() => foldersByParent[ROOT_FOLDER_KEY] ?? [], [foldersByParent])
  const currentChildFolders = useMemo(
    () => foldersByParent[selectedFolderId ?? ROOT_FOLDER_KEY] ?? [],
    [foldersByParent, selectedFolderId],
  )
  const directFileCountByFolderId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const file of files) {
      if (!file.folderId) continue
      counts.set(file.folderId, (counts.get(file.folderId) ?? 0) + 1)
    }
    return counts
  }, [files])
  const totalFileCountByFolderId = useMemo(() => {
    const counts = new Map<string, number>()

    const countFilesForFolder = (folderId: string): number => {
      if (counts.has(folderId)) {
        return counts.get(folderId) ?? 0
      }

      let total = directFileCountByFolderId.get(folderId) ?? 0
      const childFolders = foldersByParent[folderId] ?? []

      for (const childFolder of childFolders) {
        total += countFilesForFolder(childFolder.id)
      }

      counts.set(folderId, total)
      return total
    }

    for (const folder of Object.values(foldersByParent).flat()) {
      countFilesForFolder(folder.id)
    }

    return counts
  }, [directFileCountByFolderId, foldersByParent])
  const allFolders = useMemo(() => Object.values(foldersByParent).flat(), [foldersByParent])
  const directChildItemCountByFolderId = useMemo(() => {
    const map = new Map<string, number>()
    for (const folder of allFolders) {
      const childFolders = foldersByParent[folder.id] ?? []
      const filesInFolder = directFileCountByFolderId.get(folder.id) ?? 0
      map.set(folder.id, childFolders.length + filesInFolder)
    }
    return map
  }, [allFolders, foldersByParent, directFileCountByFolderId])
  const allFolderIds = useMemo(() => new Set(allFolders.map((folder) => folder.id)), [allFolders])
  const folderNameById = useMemo(() => {
    return new Map(allFolders.map((folder) => [folder.id, folder.name]))
  }, [allFolders])
  const selectedPathFolderIds = useMemo(
    () => new Set(breadcrumbs.map((folder) => folder.id)),
    [breadcrumbs],
  )

  const hasFolders = topLevelFolders.length > 0
  const canUploadToSelectedFolder = canWrite && canUploadDocuments
  const currentPathLabel = selectedFolder
    ? breadcrumbs.map((crumb) => crumb.name).join(' · ')
    : t('vault.documentsManager.allDocumentsLabel')
  const currentFileCount = selectedFolderId
    ? totalFileCountByFolderId.get(selectedFolderId) ?? 0
    : files.length
  const summaryLabel = [
    t('vault.documentsManager.subfolderCount', { count: currentChildFolders.length }),
    t('vault.documentsManager.fileCount', { count: currentFileCount }),
  ].join(' · ')

  useEffect(() => {
    setPickerSelection(emptyPickerSelection())
  }, [selectedFolderId])

  useEffect(() => {
    setPickerSelection((s) => {
      let changed = false
      const nextFiles = new Set<string>()
      const nextFolders = new Set<string>()
      for (const id of s.fileIds) {
        if (driveFileIdSet.has(id)) nextFiles.add(id)
        else changed = true
      }
      for (const id of s.folderIds) {
        if (driveFolderIdSet.has(id)) nextFolders.add(id)
        else changed = true
      }
      if (
        !changed &&
        nextFiles.size === s.fileIds.size &&
        nextFolders.size === s.folderIds.size
      ) {
        return s
      }
      return { fileIds: nextFiles, folderIds: nextFolders }
    })
  }, [driveFileIdSet, driveFolderIdSet])

  useEffect(() => {
    setExpandedFolderIds((current) => {
      const next = new Set(Array.from(current).filter((folderId) => allFolderIds.has(folderId)))

      if (!hasInitializedExpandedFoldersRef.current) {
        for (const folder of topLevelFolders) {
          next.add(folder.id)
        }
        hasInitializedExpandedFoldersRef.current = true
      }

      for (const folder of breadcrumbs) {
        next.add(folder.id)
      }

      return areSetsEqual(current, next) ? current : next
    })
  }, [allFolderIds, breadcrumbs, topLevelFolders])

  useEffect(() => {
    const reset = () => {
      setIsDropZoneActive(false)
    }

    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)

    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
    }
  }, [])

  const clearDragState = () => {
    setIsDropZoneActive(false)
  }

  const hasDragFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes('Files')

  const handleWorkspaceDragOver = (event: DragEvent<HTMLElement>) => {
    if (!canWrite || isBusy) return
    if (!hasDragFiles(event)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = canUploadDocuments ? 'copy' : 'none'
    if (canUploadDocuments) {
      setIsDropZoneActive(true)
    }
  }

  const handleWorkspaceDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!canWrite) return
    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return
    }
    clearDragState()
  }

  const handleWorkspaceDrop = async (event: DragEvent<HTMLElement>) => {
    if (!canWrite || isBusy) return
    if (!hasDragFiles(event)) return
    event.preventDefault()
    event.stopPropagation()
    clearDragState()
    if (!canUploadDocuments) {
      onQuotaExhausted?.('document_file')
      return
    }
    const droppedFiles = event.dataTransfer.files
    if (!droppedFiles || droppedFiles.length === 0) return
    await uploadFiles(droppedFiles, selectedFolderId)
  }

  const openFilePicker = () => {
    if (!canWrite || isBusy) return
    if (!canUploadDocuments) {
      onQuotaExhausted?.('document_file')
      return
    }
    fileInputRef.current?.click()
  }

  const onFilesSelected: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return
    if (!canUploadDocuments) {
      onQuotaExhausted?.('document_file')
      event.target.value = ''
      return
    }
    await uploadFiles(selectedFiles, selectedFolderId)
    event.target.value = ''
  }

  const startCreateFolder = (parentFolderId: string | null) => {
    if (!canWrite) return
    if (!canCreateFolder) {
      onQuotaExhausted?.('document_folder')
      return
    }
    setTextDialog({
      kind: 'create-folder',
      parentFolderId,
      value: '',
    })
  }

  const startRenameFolder = (folder: DecryptedVaultDocumentFolder) => {
    setTextDialog({
      kind: 'rename-folder',
      folder,
      value: folder.name,
    })
  }

  const startRenameFile = (file: DecryptedVaultDocumentFile) => {
    setTextDialog({
      kind: 'rename-file',
      file,
      value: file.name,
    })
  }

  const openDeleteFolderDialog = (folder: DecryptedVaultDocumentFolder) => {
    const subtreeFolderIDs = collectSubtreeFolderIds(folder.id, foldersByParent)
    const subtreeFolderIDSet = new Set(subtreeFolderIDs)
    const affectedFileIds = getFileIdsInFolderSubtree(files, subtreeFolderIDSet)

    if (affectedFileIds.length > 0) {
      const destinationOptions = buildDeleteFolderMoveDestinationOptions(allFolders, subtreeFolderIDSet)

      setDeleteFolderOptionsDialog({
        folder,
        affectedFileIds,
        affectedFileCount: affectedFileIds.length,
        destinationOptions,
      })
      return
    }

    setConfirmDialog({ kind: 'delete-folder', folder })
  }

  const openDeleteFileDialog = (file: DecryptedVaultDocumentFile) => {
    setConfirmDialog({ kind: 'delete-file', file })
  }

  const toggleFileSelected = useCallback((fileId: string) => {
    setPickerSelection((s) => {
      const nextFiles = new Set(s.fileIds)
      if (nextFiles.has(fileId)) nextFiles.delete(fileId)
      else nextFiles.add(fileId)
      return { ...s, fileIds: nextFiles }
    })
  }, [])

  const toggleFolderSelected = useCallback((folderId: string) => {
    setPickerSelection((s) => {
      const nextFolders = new Set(s.folderIds)
      if (nextFolders.has(folderId)) nextFolders.delete(folderId)
      else nextFolders.add(folderId)
      return { ...s, folderIds: nextFolders }
    })
  }, [])

  const toggleSelectAllVisible = useCallback(() => {
    const fileIds = driveFiles.map((f) => f.id)
    const folderIds = driveFolders.map((f) => f.id)
    setPickerSelection((s) => {
      const allSelected =
        fileIds.length + folderIds.length > 0 &&
        fileIds.every((id) => s.fileIds.has(id)) &&
        folderIds.every((id) => s.folderIds.has(id))
      if (allSelected) {
        const nf = new Set(s.fileIds)
        const nd = new Set(s.folderIds)
        for (const id of fileIds) nf.delete(id)
        for (const id of folderIds) nd.delete(id)
        return { fileIds: nf, folderIds: nd }
      }
      const nf = new Set(s.fileIds)
      const nd = new Set(s.folderIds)
      for (const id of fileIds) nf.add(id)
      for (const id of folderIds) nd.add(id)
      return { fileIds: nf, folderIds: nd }
    })
  }, [driveFiles, driveFolders])

  const clearPickerSelection = useCallback(() => {
    setPickerSelection(emptyPickerSelection())
  }, [])

  const openDeleteSelectionDialog = useCallback(() => {
    const selectedFiles = driveFiles.filter((f) => pickerSelection.fileIds.has(f.id))
    const selectedFolderObjs = driveFolders.filter((f) => pickerSelection.folderIds.has(f.id))
    if (selectedFiles.length === 0 && selectedFolderObjs.length === 0) return

    const emptyFolders: DecryptedVaultDocumentFolder[] = []
    const blockedFolderNames: string[] = []
    for (const folder of selectedFolderObjs) {
      const subtreeIds = collectSubtreeFolderIds(folder.id, foldersByParent)
      const affected = getFileIdsInFolderSubtree(files, new Set(subtreeIds))
      if (affected.length === 0) emptyFolders.push(folder)
      else blockedFolderNames.push(folder.name)
    }

    if (selectedFiles.length === 0 && emptyFolders.length === 0) {
      return
    }

    setConfirmDialog({
      kind: 'delete-drive-selection',
      files: selectedFiles,
      emptyFolders,
      blockedFolderNames,
    })
  }, [driveFiles, driveFolders, files, foldersByParent, pickerSelection.fileIds, pickerSelection.folderIds])

  const handleBulkDownload = useCallback(async () => {
    const selected = driveFiles.filter((f) => pickerSelection.fileIds.has(f.id))
    if (selected.length === 0) return
    setIsSelectionActionBusy(true)
    try {
      for (const file of selected) {
        await downloadFile(file)
        await new Promise((r) => window.setTimeout(r, 350))
      }
    } finally {
      setIsSelectionActionBusy(false)
    }
  }, [downloadFile, driveFiles, pickerSelection.fileIds])

  const handleViewSelected = useCallback(async () => {
    if (pickerSelection.folderIds.size !== 0) return
    const selected = driveFiles.filter((f) => pickerSelection.fileIds.has(f.id))
    if (selected.length !== 1) return
    setIsSelectionActionBusy(true)
    try {
      await viewDocumentFile(selected[0])
    } finally {
      setIsSelectionActionBusy(false)
    }
  }, [driveFiles, pickerSelection.fileIds, pickerSelection.folderIds, viewDocumentFile])

  const closeTextDialog = () => {
    setTextDialog(null)
  }

  const setTextDialogValue = (value: string) => {
    setTextDialog((current) => (current ? { ...current, value } : current))
  }

  const submitTextDialog = async () => {
    if (!textDialog) return

    if (textDialog.kind === 'create-folder') {
      const ok = await createFolder(textDialog.value, textDialog.parentFolderId)
      if (ok) closeTextDialog()
      return
    }

    if (textDialog.kind === 'rename-folder') {
      const ok = await renameFolder(textDialog.folder.id, textDialog.value)
      if (ok) closeTextDialog()
      return
    }

    const ok = await renameFile(textDialog.file.id, textDialog.value)
    if (ok) closeTextDialog()
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(null)
  }

  const closeDeleteFolderOptionsDialog = () => {
    setDeleteFolderOptionsDialog(null)
  }

  const openMoveFolderFilesDialog = () => {
    if (!deleteFolderOptionsDialog || deleteFolderOptionsDialog.destinationOptions.length === 0) {
      return
    }

    setMoveFolderFilesDialog({
      folder: deleteFolderOptionsDialog.folder,
      affectedFileIds: deleteFolderOptionsDialog.affectedFileIds,
      affectedFileCount: deleteFolderOptionsDialog.affectedFileCount,
      destinationOptions: deleteFolderOptionsDialog.destinationOptions,
      destinationFolderId: deleteFolderOptionsDialog.destinationOptions[0].id,
    })
    setDeleteFolderOptionsDialog(null)
  }

  const closeMoveFolderFilesDialog = () => {
    setMoveFolderFilesDialog(null)
  }

  const setMoveFolderDestination = (folderId: string) => {
    setMoveFolderFilesDialog((current) => (current ? { ...current, destinationFolderId: folderId } : current))
  }

  const submitConfirmDialog = async () => {
    if (!confirmDialog) return

    if (confirmDialog.kind === 'delete-folder') {
      const ok = await deleteFolder(confirmDialog.folder.id)
      if (ok) closeConfirmDialog()
      return
    }

    if (confirmDialog.kind === 'delete-drive-selection') {
      setIsSelectionActionBusy(true)
      try {
        for (const file of confirmDialog.files) {
          const ok = await deleteFile(file.id)
          if (ok) {
            setPickerSelection((s) => {
              const nf = new Set(s.fileIds)
              nf.delete(file.id)
              return { ...s, fileIds: nf }
            })
          }
          if (!ok) break
        }
        for (const folder of confirmDialog.emptyFolders) {
          const ok = await deleteFolder(folder.id)
          if (ok) {
            setPickerSelection((s) => {
              const nd = new Set(s.folderIds)
              nd.delete(folder.id)
              return { ...s, folderIds: nd }
            })
          }
          if (!ok) break
        }
        closeConfirmDialog()
      } finally {
        setIsSelectionActionBusy(false)
      }
      return
    }

    const ok = await deleteFile(confirmDialog.file.id)
    if (ok) {
      setPickerSelection((s) => {
        const nf = new Set(s.fileIds)
        nf.delete(confirmDialog.file.id)
        return { ...s, fileIds: nf }
      })
      closeConfirmDialog()
    }
  }

  const submitDeleteFolderWithFiles = async () => {
    if (!deleteFolderOptionsDialog) return

    const ok = await deleteFolder(deleteFolderOptionsDialog.folder.id)
    if (ok) {
      closeDeleteFolderOptionsDialog()
    }
  }

  const submitMoveFolderFilesDialog = async () => {
    if (!moveFolderFilesDialog) return

    const moveOk = await moveFilesToFolder(
      moveFolderFilesDialog.affectedFileIds,
      moveFolderFilesDialog.destinationFolderId,
    )
    if (!moveOk) {
      return
    }

    const deleteOk = await deleteFolder(moveFolderFilesDialog.folder.id)
    if (!deleteOk) {
      return
    }

    setMoveFolderFilesDialog(null)
    setDeleteFolderOptionsDialog(null)
  }

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current)
      if (next.has(folderId)) {
        if (selectedPathFolderIds.has(folderId) && selectedFolderId !== folderId) {
          return current
        }
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const textDialogTitle =
    textDialog?.kind === 'create-folder'
      ? textDialog.parentFolderId
        ? t('vault.documentsManager.createSubfolderTitle')
        : t('vault.documentsManager.createFolderTitle')
      : textDialog?.kind === 'rename-folder'
        ? t('vault.documentsManager.renameFolderTitle')
        : t('vault.documentsManager.renameDocumentTitle')

  const textDialogDescription =
    textDialog?.kind === 'create-folder'
      ? textDialog.parentFolderId
        ? t('vault.documentsManager.createSubfolderDescription', {
            name: folderNameById.get(textDialog.parentFolderId) ?? '',
          })
        : t('vault.documentsManager.createFolderDescription')
      : textDialog?.kind === 'rename-folder'
        ? t('vault.documentsManager.renameFolderDescription', {
            name: textDialog.folder.name,
          })
        : t('vault.documentsManager.renameDocumentDescription', {
            name: textDialog?.kind === 'rename-file' ? textDialog.file.name : '',
          })

  const confirmDialogTitle =
    confirmDialog?.kind === 'delete-drive-selection'
      ? t('vault.documentsManager.deleteDriveSelectionTitle', {
          count: confirmDialog.files.length + confirmDialog.emptyFolders.length,
        })
      : confirmDialog?.kind === 'delete-folder'
        ? t('vault.documentsManager.deleteFolderTitle')
        : t('vault.documentsManager.deleteDocumentTitle')

  const confirmDialogDescription =
    confirmDialog?.kind === 'delete-drive-selection'
      ? (() => {
          const fileNames = confirmDialog.files.map((f) => f.name)
          const folderNames = confirmDialog.emptyFolders.map((f) => f.name)
          const names = [...fileNames, ...folderNames]
          const preview =
            names.slice(0, 3).join(', ') + (names.length > 3 ? ` (+${names.length - 3})` : '')
          const blocked = confirmDialog.blockedFolderNames
          const blockedSuffix =
            blocked.length > 0
              ? '\n\n' +
                t('vault.documentsManager.deleteDriveSelectionBlockedFolders', {
                  names: blocked.join(', '),
                })
              : ''
          return (
            t('vault.documentsManager.deleteDriveSelectionDescription', {
              count: names.length,
              preview,
            }) + blockedSuffix
          )
        })()
      : confirmDialog?.kind === 'delete-folder'
        ? t('vault.documentsManager.deleteFolderDescription', {
            name: confirmDialog.folder.name,
          })
        : t('vault.documentsManager.deleteDocumentDescription', {
            name: confirmDialog?.kind === 'delete-file' ? confirmDialog.file.name : '',
          })

  return {
    fileInputRef,
    textDialog,
    confirmDialog,
    deleteFolderOptionsDialog,
    moveFolderFilesDialog,
    expandedFolderIds,
    totalFileCountByFolderId,
    directChildItemCountByFolderId,
    hasFolders,
    canUploadToSelectedFolder,
    currentPathLabel,
    summaryLabel,
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
    toggleFolderExpanded,
    handleWorkspaceDragOver,
    handleWorkspaceDragLeave,
    handleWorkspaceDrop,
    textDialogTitle,
    textDialogDescription,
    confirmDialogTitle,
    confirmDialogDescription,
    pickerSelection,
    selectedItemCount: pickerSelection.fileIds.size + pickerSelection.folderIds.size,
    toggleFileSelected,
    toggleFolderSelected,
    toggleSelectAllVisible,
    clearPickerSelection,
    openDeleteSelectionDialog,
    handleBulkDownload,
    handleViewSelected,
    isSelectionActionBusy,
  }
}

export { ROOT_FOLDER_KEY }
