import type { ChangeEvent, RefObject } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY,
  attachmentDocumentPickerFolderAncestorIds,
  buildAttachmentDocumentPickerIndices,
  countAttachmentDocumentFilesInFolderSubtree,
  filterAttachmentDocumentPickerFilesByQuery,
  type AttachmentDocumentPickerFile,
  type AttachmentDocumentPickerFolder,
} from '../../model/attachment-document-picker-tree'

export type UseAssetAttachmentDocumentPickerArgs = {
  documentsFolders: AttachmentDocumentPickerFolder[]
  documentsFiles: AttachmentDocumentPickerFile[]
  canManageDocuments: boolean
  isBusy: boolean
  folderUploadInputRef: RefObject<HTMLInputElement | null>
  folderUploadTargetRef: RefObject<string | null>
  onCreateDocumentsFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (
    folderId: string,
    file: File,
  ) => Promise<{ id: string; name: string; folderId: string | null } | null>
  onLinkDocument: (file: AttachmentDocumentPickerFile) => void
}

export function useAssetAttachmentDocumentPicker({
  documentsFolders,
  documentsFiles,
  canManageDocuments,
  isBusy,
  folderUploadInputRef,
  folderUploadTargetRef,
  onCreateDocumentsFolder,
  onUploadDocumentToFolder,
  onLinkDocument,
}: UseAssetAttachmentDocumentPickerArgs) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [contextFolderId, setContextFolderId] = useState<string | null>(null)
  const [createFolderDialog, setCreateFolderDialog] = useState<{
    parentFolderId: string | null
    value: string
  } | null>(null)

  const indices = useMemo(
    () => buildAttachmentDocumentPickerIndices(documentsFolders, documentsFiles),
    [documentsFolders, documentsFiles],
  )

  const { filesSorted, folderById, foldersByParent, topLevelFolders, directFilesByFolderId } = indices

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(
    () => filterAttachmentDocumentPickerFilesByQuery(filesSorted, folderById, normalizedSearchQuery),
    [filesSorted, folderById, normalizedSearchQuery],
  )

  const selectedLinkedFile = useMemo(
    () => (selectedFileId ? filesSorted.find((file) => file.id === selectedFileId) ?? null : null),
    [filesSorted, selectedFileId],
  )

  const contextFolderName =
    contextFolderId && folderById.has(contextFolderId)
      ? (folderById.get(contextFolderId)?.name ?? '')
      : null

  const fileCountInSubtree = useCallback(
    (folderId: string) => countAttachmentDocumentFilesInFolderSubtree(folderId, filesSorted, folderById),
    [filesSorted, folderById],
  )

  const toggleFolderExpanded = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }, [])

  const expandFolderAndAncestors = useCallback(
    (folderId: string) => {
      const chain = attachmentDocumentPickerFolderAncestorIds(folderId, folderById)
      setExpandedFolderIds((prev) => {
        const next = new Set(prev)
        for (const id of chain) next.add(id)
        return next
      })
      setContextFolderId(folderId)
    },
    [folderById],
  )

  const onFolderRowClick = useCallback(
    (folderId: string, canExpand: boolean) => {
      setContextFolderId(folderId)
      if (canExpand) toggleFolderExpanded(folderId)
    },
    [toggleFolderExpanded],
  )

  const openFolderUploadPicker = useCallback(
    (folderId: string) => {
      if (isBusy || !canManageDocuments) return
      folderUploadTargetRef.current = folderId
      folderUploadInputRef.current?.click()
    },
    [canManageDocuments, folderUploadInputRef, folderUploadTargetRef, isBusy],
  )

  const startCreateFolder = useCallback(() => {
    if (isBusy || !canManageDocuments) return
    setCreateFolderDialog({
      parentFolderId: contextFolderId,
      value: '',
    })
  }, [canManageDocuments, contextFolderId, isBusy])

  const submitCreateFolder = useCallback(async () => {
    if (!createFolderDialog) return
    const name = createFolderDialog.value.trim()
    if (!name) return
    const newId = await onCreateDocumentsFolder(name, createFolderDialog.parentFolderId)
    setCreateFolderDialog(null)
    if (newId) {
      expandFolderAndAncestors(newId)
    }
  }, [createFolderDialog, expandFolderAndAncestors, onCreateDocumentsFolder])

  const onFolderUploadInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const folderId = folderUploadTargetRef.current
      folderUploadTargetRef.current = null
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ''
      if (!file || !folderId) return
      void onUploadDocumentToFolder(folderId, file).then((meta) => {
        if (meta) {
          setSelectedFileId(meta.id)
          expandFolderAndAncestors(meta.folderId ?? folderId)
        }
      })
    },
    [expandFolderAndAncestors, folderUploadTargetRef, onUploadDocumentToFolder],
  )

  const handleLinkDocument = useCallback(() => {
    if (isBusy) return
    if (selectedLinkedFile) {
      onLinkDocument(selectedLinkedFile)
    }
  }, [isBusy, onLinkDocument, selectedLinkedFile])

  const setCreateFolderDialogValue = useCallback((value: string) => {
    setCreateFolderDialog((current) => (current ? { ...current, value } : current))
  }, [])

  const closeCreateFolderDialog = useCallback(() => {
    setCreateFolderDialog(null)
  }, [])

  const createFolderDialogTitle = t('vault.documentsManager.createFolderTitle')
  const createFolderDialogDescription = contextFolderName
    ? t('vault.assets.attachments.createFolderInParentDescription', { name: contextFolderName })
    : t('vault.assets.attachments.createFolderInRootDescription')

  return {
    rootParentKey: ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY,
    searchQuery,
    setSearchQuery,
    normalizedSearchQuery,
    searchResults,
    foldersByParent,
    topLevelFolders,
    directFilesByFolderId,
    rootFiles: directFilesByFolderId.get(ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY) ?? [],
    expandedFolderIds,
    selectedFileId,
    setSelectedFileId,
    selectedLinkedFile,
    canManageDocuments,
    isBusy,
    fileCountInSubtree,
    onFolderRowClick,
    openFolderUploadPicker,
    onFolderUploadInputChange,
    startCreateFolder,
    createFolderDialog,
    createFolderDialogTitle,
    createFolderDialogDescription,
    setCreateFolderDialogValue,
    closeCreateFolderDialog,
    submitCreateFolder,
    handleLinkDocument,
  }
}
