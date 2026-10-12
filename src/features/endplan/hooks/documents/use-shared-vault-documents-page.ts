import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useKeyMaterial } from '@/features/keys'
import type { ApiError } from '@/shared/api/client'
import { decryptDocumentFile, unwrapDekWithKeyPair } from '@/shared/lib'
import { toast } from '@/shared/ui'
import { useVault } from '../../api/hooks/queries/use-vault-queries'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import {
  vaultDocumentsApi,
  type VaultDocumentFile,
  type VaultDocumentFolder,
} from '../../api/clients/vault-api'
import { ROOT_FOLDER_KEY } from '../../model/vault-documents-tree'
import { useVaultDocumentsDecryptedTree } from './use-vault-documents-tree-decrypted'
import { useVaultDocumentViewer } from './use-vault-document-viewer'

type FolderChildrenMap = Record<string, SharedDecryptedVaultDocumentFolder[]>

export type SharedDecryptedVaultDocumentFolder = VaultDocumentFolder & {
  name: string
}

export type SharedDecryptedVaultDocumentFile = VaultDocumentFile & {
  name: string
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'apiMessage' in error) {
    const apiMessage = (error as ApiError).apiMessage
    if (apiMessage) return apiMessage
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useSharedVaultDocumentsPage(vaultId: string | undefined) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()
  const {
    data: vault,
    isLoading: isVaultLoading,
    error: vaultError,
  } = useVault(vaultId, { enabled: !!vaultId })
  const {
    folders: decryptedFoldersRaw,
    files: decryptedFilesRaw,
    documentsTreeQuery,
    isDecrypting,
  } = useVaultDocumentsDecryptedTree(vault)
  const decryptedFolders = decryptedFoldersRaw as SharedDecryptedVaultDocumentFolder[]
  const decryptedFiles = decryptedFilesRaw as SharedDecryptedVaultDocumentFile[]

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const dekRef = useRef<Uint8Array | null>(null)
  const dekCacheKeyRef = useRef<string | null>(null)

  const getDek = useCallback(async () => {
    if (!vault || !vault.wrappedDek || !publicKeyB64 || !privateKeyB64) return null
    const cacheKey = `${vault.id}:${publicKeyB64}:${privateKeyB64}:${vault.wrappedDek}`
    if (dekCacheKeyRef.current === cacheKey && dekRef.current) {
      return dekRef.current
    }
    const dek = await unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
    dekRef.current = dek
    dekCacheKeyRef.current = cacheKey
    return dek
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  useEffect(() => {
    const nextVaultID = vault?.id ?? null
    if (!nextVaultID) {
      setSelectedFolderId(null)
      dekRef.current = null
      dekCacheKeyRef.current = null
    }
  }, [vault?.id])

  useEffect(() => {
    if (!selectedFolderId) return
    if (isDecrypting || documentsTreeQuery.isFetching) return
    const exists = decryptedFolders.some((folder) => folder.id === selectedFolderId)
    if (!exists) {
      setSelectedFolderId(null)
    }
  }, [decryptedFolders, documentsTreeQuery.isFetching, isDecrypting, selectedFolderId])

  const foldersByParent = useMemo<FolderChildrenMap>(() => {
    const grouped: FolderChildrenMap = {}
    for (const folder of decryptedFolders) {
      const key = folder.parentFolderId ?? ROOT_FOLDER_KEY
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(folder)
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name))
    }
    return grouped
  }, [decryptedFolders])

  const folderIndex = useMemo(
    () => new Map(decryptedFolders.map((folder) => [folder.id, folder])),
    [decryptedFolders],
  )

  const breadcrumbs = useMemo(() => {
    if (!selectedFolderId) return []
    const items: SharedDecryptedVaultDocumentFolder[] = []
    let current = folderIndex.get(selectedFolderId) ?? null
    const visited = new Set<string>()
    for (let i = 0; i < 50; i += 1) {
      if (!current || visited.has(current.id)) break
      visited.add(current.id)
      items.push(current)
      current = current.parentFolderId ? folderIndex.get(current.parentFolderId) ?? null : null
    }
    return items.reverse()
  }, [folderIndex, selectedFolderId])

  const visibleFiles = useMemo(() => {
    return decryptedFiles
      .filter((file) => {
        if (!selectedFolderId) return !file.folderId
        return file.folderId === selectedFolderId
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [decryptedFiles, selectedFolderId])

  const refreshTree = useCallback(async () => {
    if (!vault?.id) return
    await queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vault.id) })
  }, [queryClient, vault?.id])

  const downloadFile = useCallback(
    async (file: SharedDecryptedVaultDocumentFile) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!file.fileIv) {
        toast.error('File is not ready for download')
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error('Encryption keys not available')
          return false
        }
        const payload = await vaultDocumentsApi.getDownloadURL(vault.id, file.id)
        const encryptedRes = await fetch(payload.downloadUrl)
        if (!encryptedRes.ok) {
          throw new Error(`Download failed (${encryptedRes.status})`)
        }

        const encryptedBytes = new Uint8Array(await encryptedRes.arrayBuffer())
        const decrypted = await decryptDocumentFile(
          encryptedBytes,
          payload.file.fileIv ?? file.fileIv,
          dek,
          vault.id,
          vault.ownerId,
        )
        const normalizedDecrypted = new Uint8Array(decrypted)

        const blob = new Blob([normalizedDecrypted], {
          type: file.mimeType || 'application/octet-stream',
        })
        const objectURL = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectURL
        link.download = file.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(objectURL), 500)
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to download document'))
        return false
      }
    },
    [getDek, t, vault],
  )

  const { viewDocumentFile, documentViewer } = useVaultDocumentViewer<SharedDecryptedVaultDocumentFile>({
    vault,
    getDek,
    downloadFile,
    t,
  })

  const rawError = vaultError ?? documentsTreeQuery.error
  const error = rawError
    ? rawError instanceof Error
      ? rawError.message
      : 'Failed to load shared documents'
    : null

  return {
    isLoading: isVaultLoading || documentsTreeQuery.isLoading,
    isDecrypting,
    isRefreshing: documentsTreeQuery.isFetching,
    error,
    foldersByParent,
    files: decryptedFiles,
    visibleFiles,
    selectedFolderId,
    selectedFolder: selectedFolderId ? folderIndex.get(selectedFolderId) ?? null : null,
    breadcrumbs,
    setSelectedFolderId,
    downloadFile,
    viewDocumentFile,
    documentViewer,
    refreshTree,
  }
}
