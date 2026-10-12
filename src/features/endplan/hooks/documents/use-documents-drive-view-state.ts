import { useMemo, useState } from 'react'
import type { DecryptedVaultDocumentFile, DecryptedVaultDocumentFolder } from './use-vault-documents-page'
import {
  type DocumentsDriveViewMode,
  filterItemsByNameQuery,
  flattenFoldersFromParentMap,
  getChildFoldersForParent,
  sortByCreatedAt,
} from '../../model/vault-documents-tree'

export type { DocumentsDriveViewMode }

type UseDocumentsDriveViewStateArgs = {
  foldersByParent: Record<string, DecryptedVaultDocumentFolder[]>
  visibleFiles: DecryptedVaultDocumentFile[]
  selectedFolderId: string | null
  /** All decrypted files in the vault (global search pool when searching). */
  files: DecryptedVaultDocumentFile[]
}

export function useDocumentsDriveViewState({
  foldersByParent,
  visibleFiles,
  selectedFolderId,
  files,
}: UseDocumentsDriveViewStateArgs) {
  const [viewMode, setViewMode] = useState<DocumentsDriveViewMode>('grid')
  const [sortCreatedDesc, setSortCreatedDesc] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [prevSelectedFolderId, setPrevSelectedFolderId] = useState(selectedFolderId)

  if (selectedFolderId !== prevSelectedFolderId) {
    setPrevSelectedFolderId(selectedFolderId)
    setSearchQuery('')
  }

  const rawChildFolders = useMemo(
    () => getChildFoldersForParent(foldersByParent, selectedFolderId),
    [foldersByParent, selectedFolderId],
  )

  const allFoldersFlat = useMemo(() => flattenFoldersFromParentMap(foldersByParent), [foldersByParent])

  const isGlobalSearch = searchQuery.trim().length > 0

  const driveFolders = useMemo(() => {
    const pool = isGlobalSearch ? allFoldersFlat : rawChildFolders
    const filtered = filterItemsByNameQuery(pool, searchQuery)
    return sortByCreatedAt(filtered, sortCreatedDesc)
  }, [allFoldersFlat, isGlobalSearch, rawChildFolders, searchQuery, sortCreatedDesc])

  const driveFiles = useMemo(() => {
    const pool = isGlobalSearch ? files : visibleFiles
    const filtered = filterItemsByNameQuery(pool, searchQuery)
    return sortByCreatedAt(filtered, sortCreatedDesc)
  }, [files, isGlobalSearch, visibleFiles, searchQuery, sortCreatedDesc])

  const hasRawItemsInView = isGlobalSearch
    ? allFoldersFlat.length > 0 || files.length > 0
    : rawChildFolders.length > 0 || visibleFiles.length > 0

  const showNoSearchResults =
    searchQuery.trim().length > 0 &&
    driveFolders.length === 0 &&
    driveFiles.length === 0 &&
    hasRawItemsInView

  return {
    viewMode,
    setViewMode,
    sortCreatedDesc,
    setSortCreatedDesc,
    searchQuery,
    setSearchQuery,
    rawChildFolders,
    driveFolders,
    driveFiles,
    hasRawItemsInView,
    showNoSearchResults,
  }
}
