import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import { useKeyMaterial } from '@/features/keys'
import type { ApiError } from '@/shared/api/client'
import {
  decryptDocumentFile,
  encryptDocumentFile,
  encryptDocumentName,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { toast } from '@/shared/ui'
import {
  useCompleteVaultDocumentUpload,
  useCreateVaultDocumentFolder,
  useDeleteVaultDocumentFile,
  useDeleteVaultDocumentFolder,
  useInitVaultDocumentUpload,
  useUpdateVaultDocumentFile,
  useUpdateVaultDocumentFolder,
} from '../../api/hooks/mutations/use-vault-mutations'
import { useUserVault } from '../../api/hooks/queries/use-vault-queries'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import { vaultDocumentsApi } from '../../api/clients/vault-api'
import { resolveAllowedDocumentMimeType } from '../../model/document-upload-policy'
import {
  canCreateDocumentFolder,
  canUploadAtLeastOneDocumentFile,
  checkFileUploadsAgainstPlan,
  checkFolderCreateAgainstPlan,
  resolveDocumentsPlanLimits,
  sumUploadedOriginalBytes,
} from '../../model/vault-documents-plan-guards'
import { batchUploadOverallPercent, putBlobWithUploadProgress } from '../../lib/vault-document-upload-put'
import { ROOT_FOLDER_KEY } from '../../model/vault-documents-tree'
import {
  useVaultDocumentsDecryptedTree,
  type DecryptedVaultDocumentFile,
  type DecryptedVaultDocumentFolder,
} from './use-vault-documents-tree-decrypted'
import { useVaultDocumentViewer } from './use-vault-document-viewer'

export type { DecryptedVaultDocumentFile, DecryptedVaultDocumentFolder }

export type VaultDocumentUploadProgress = {
  totalFiles: number
  /** Files fully completed (including finalize mutation). */
  completedFiles: number
  currentFileName: string
  percent: number
  isDone: boolean
}

type FolderChildrenMap = Record<string, DecryptedVaultDocumentFolder[]>

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'apiMessage' in error) {
    const apiMessage = (error as ApiError).apiMessage
    if (apiMessage) return apiMessage
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useVaultDocumentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()
  const { data: vault, isLoading: isVaultLoading } = useUserVault({ ownerUserId: user?.id })
  const {
    folders: decryptedFolders,
    files: decryptedFiles,
    documentsTreeQuery,
    isDecrypting,
  } = useVaultDocumentsDecryptedTree(vault)
  const { data: subscriptionResponse, isLoading: isSubscriptionLoading } = useSubscription({
    enabled: !!vault,
  })
  const documentPlanLimits = useMemo(
    () =>
      resolveDocumentsPlanLimits({
        features: subscriptionResponse?.features,
        tier: subscriptionResponse?.subscription?.tier,
        inTrial: subscriptionResponse?.inTrial,
        hasActiveSubscription: subscriptionResponse?.hasActiveSubscription,
        canAccess: subscriptionResponse?.canAccess,
      }),
    [
      subscriptionResponse?.canAccess,
      subscriptionResponse?.features,
      subscriptionResponse?.hasActiveSubscription,
      subscriptionResponse?.inTrial,
      subscriptionResponse?.subscription?.tier,
    ],
  )
  const vaultStorageUsedBytes = useMemo(
    () => sumUploadedOriginalBytes(decryptedFiles),
    [decryptedFiles],
  )
  const canCreateFolder = useMemo(
    () =>
      canCreateDocumentFolder({
        limits: documentPlanLimits,
        currentFolderCount: decryptedFolders.length,
      }),
    [decryptedFolders.length, documentPlanLimits],
  )
  const canUploadDocuments = useMemo(
    () =>
      canUploadAtLeastOneDocumentFile({
        limits: documentPlanLimits,
        currentFileCount: decryptedFiles.length,
        currentTotalSizeBytes: vaultStorageUsedBytes,
      }),
    [decryptedFiles.length, documentPlanLimits, vaultStorageUsedBytes],
  )

  const createFolderMutation = useCreateVaultDocumentFolder(vault?.id ?? '')
  const updateFolderMutation = useUpdateVaultDocumentFolder(vault?.id ?? '')
  const deleteFolderMutation = useDeleteVaultDocumentFolder(vault?.id ?? '')
  const initUploadMutation = useInitVaultDocumentUpload(vault?.id ?? '')
  const updateFileMutation = useUpdateVaultDocumentFile(vault?.id ?? '')
  const moveFileMutation = useUpdateVaultDocumentFile(vault?.id ?? '', {
    invalidateQueries: false,
  })
  const completeUploadMutation = useCompleteVaultDocumentUpload(vault?.id ?? '', {
    invalidateQueries: false,
  })
  const deleteFileMutation = useDeleteVaultDocumentFile(vault?.id ?? '')

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<VaultDocumentUploadProgress | null>(null)
  const [isMovingFiles, setIsMovingFiles] = useState(false)
  const dekRef = useRef<Uint8Array | null>(null)
  const dekCacheKeyRef = useRef<string | null>(null)
  const uploadPercentThrottleRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null
    pending: number
  }>({ timer: null, pending: 0 })

  const UPLOAD_PROGRESS_THROTTLE_MS = 120

  const clearUploadPercentThrottle = useCallback(() => {
    const t = uploadPercentThrottleRef.current.timer
    if (t) clearTimeout(t)
    uploadPercentThrottleRef.current = { timer: null, pending: 0 }
  }, [])

  const patchUploadProgress = useCallback(
    (patch: Partial<VaultDocumentUploadProgress> | 'clear') => {
      clearUploadPercentThrottle()
      if (patch === 'clear') {
        setUploadProgress(null)
        return
      }
      setUploadProgress((prev) => {
        if (!prev) return null
        return { ...prev, ...patch }
      })
    },
    [clearUploadPercentThrottle],
  )

  const emitUploadPercentThrottled = useCallback(
    (numericPercent: number) => {
      uploadPercentThrottleRef.current.pending = Math.max(
        uploadPercentThrottleRef.current.pending,
        numericPercent,
      )
      if (uploadPercentThrottleRef.current.timer) return
      uploadPercentThrottleRef.current.timer = setTimeout(() => {
        uploadPercentThrottleRef.current.timer = null
        const p = uploadPercentThrottleRef.current.pending
        uploadPercentThrottleRef.current.pending = 0
        setUploadProgress((prev) =>
          !prev ? null : { ...prev, percent: Math.round(Math.max(prev.percent, p)) },
        )
      }, UPLOAD_PROGRESS_THROTTLE_MS)
    },
    [],
  )

  const dismissUploadProgress = useCallback(() => {
    clearUploadPercentThrottle()
    setUploadProgress(null)
  }, [clearUploadPercentThrottle])

  const canWrite = !!vault && !!user && vault.ownerId === user.id

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
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
    const items: DecryptedVaultDocumentFolder[] = []
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

  const createFolder = useCallback(
    async (name: string, parentFolderId?: string | null) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      const normalizedName = name.trim()
      if (!normalizedName) {
        toast.error('Folder name is required')
        return false
      }
      const folderPlanBlock = checkFolderCreateAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFolderCount: decryptedFolders.length,
      })
      if (folderPlanBlock === 'subscription_loading') {
        toast.error(t('vault.documentsManager.planLimitsLoadingError'))
        return false
      }
      if (folderPlanBlock === 'folder_limit') {
        toast.error(t('vault.documentsManager.folderLimitReachedError', { max: documentPlanLimits.foldersMax }))
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error('Encryption keys not available')
          return false
        }
        const encrypted = await encryptDocumentName(normalizedName, dek, vault.id, vault.ownerId)
        await createFolderMutation.mutateAsync({
          parentFolderId: parentFolderId ?? undefined,
          encryptedName: encrypted.encryptedName,
          nameIv: encrypted.nameIv,
        })
        toast.success('Folder created')
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to create folder'))
        return false
      }
    },
    [
      canWrite,
      createFolderMutation,
      decryptedFolders.length,
      documentPlanLimits,
      getDek,
      isSubscriptionLoading,
      t,
      vault,
    ],
  )

  const renameFolder = useCallback(
    async (folderId: string, nextName: string) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      const normalizedName = nextName.trim()
      if (!normalizedName) {
        toast.error('Folder name is required')
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error('Encryption keys not available')
          return false
        }
        const encrypted = await encryptDocumentName(normalizedName, dek, vault.id, vault.ownerId)
        await updateFolderMutation.mutateAsync({
          folderId,
          data: {
            encryptedName: encrypted.encryptedName,
            nameIv: encrypted.nameIv,
          },
        })
        toast.success('Folder renamed')
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to rename folder'))
        return false
      }
    },
    [canWrite, getDek, t, updateFolderMutation, vault],
  )

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      try {
        await deleteFolderMutation.mutateAsync(folderId)
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null)
        }
        toast.success('Folder deleted')
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to delete folder'))
        return false
      }
    },
    [canWrite, deleteFolderMutation, selectedFolderId, t],
  )

  const uploadFiles = useCallback(
    async (files: FileList | File[], folderId?: string | null) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      const list = Array.from(files)
      if (list.length === 0) return true

      const uploadableFiles: Array<{ file: File; mimeType: string }> = []
      const rejectedFileNames: string[] = []
      for (const file of list) {
        const mimeType = resolveAllowedDocumentMimeType(file)
        if (!mimeType) {
          rejectedFileNames.push(file.name)
          continue
        }
        uploadableFiles.push({ file, mimeType })
      }

      if (rejectedFileNames.length > 0) {
        const preview = rejectedFileNames.slice(0, 3).join(', ')
        const suffix = rejectedFileNames.length > 3 ? ` +${rejectedFileNames.length - 3} more` : ''
        toast.info(
          `Skipped unsupported files: ${preview}${suffix}. Allowed types: PDF, Word, Excel, CSV, PowerPoint, TXT, RTF, and OpenDocument.`,
        )
      }

      if (uploadableFiles.length === 0) {
        toast.error('No valid document files selected.')
        return false
      }

      const uploadPlanBlock = checkFileUploadsAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFileCount: decryptedFiles.length,
        currentTotalSizeBytes: vaultStorageUsedBytes,
        files: uploadableFiles.map(({ file }) => ({ name: file.name, size: file.size })),
      })
      if (uploadPlanBlock?.kind === 'subscription_loading') {
        toast.error(t('vault.documentsManager.planLimitsLoadingError'))
        return false
      }
      if (uploadPlanBlock?.kind === 'file_limit') {
        toast.error(
          t('vault.documentsManager.fileLimitReachedError', {
            max: uploadPlanBlock.max,
            current: uploadPlanBlock.current,
            adding: uploadPlanBlock.adding,
          }),
        )
        return false
      }
      if (uploadPlanBlock?.kind === 'file_size') {
        toast.error(
          t('vault.documentsManager.fileExceedsPlanLimit', {
            name: uploadPlanBlock.fileName,
            size: formatBytes(uploadPlanBlock.maxBytes),
          }),
        )
        return false
      }
      if (uploadPlanBlock?.kind === 'total_storage') {
        toast.error(
          t('vault.documentsManager.totalStorageLimitReachedError', {
            defaultValue: 'Total document storage limit reached for your plan.',
          }),
        )
        return false
      }

      const dek = await getDek()
      if (!dek) {
        toast.error('Encryption keys not available')
        return false
      }

      const totalFiles = uploadableFiles.length
      setUploadProgress({
        totalFiles,
        completedFiles: 0,
        currentFileName: uploadableFiles[0].file.name,
        percent: 0,
        isDone: false,
      })
      setIsUploading(true)
      try {
        for (let i = 0; i < uploadableFiles.length; i++) {
          const { file, mimeType } = uploadableFiles[i]
          patchUploadProgress({
            currentFileName: file.name,
            completedFiles: i,
            isDone: false,
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 0.04)),
          })

          const encryptedName = await encryptDocumentName(file.name, dek, vault.id, vault.ownerId)
          patchUploadProgress({
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 0.1)),
          })
          const init = await initUploadMutation.mutateAsync({
            ...(folderId ? { folderId } : {}),
            encryptedName: encryptedName.encryptedName,
            nameIv: encryptedName.nameIv,
            mimeType,
            originalSizeBytes: file.size,
          })

          patchUploadProgress({
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 0.14)),
          })

          const encryptedFile = await encryptDocumentFile(file, dek, vault.id, vault.ownerId)
          patchUploadProgress({
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 0.46)),
          })

          const body = new Blob([new Uint8Array(encryptedFile.encryptedBytes)], {
            type: mimeType,
          })

          await putBlobWithUploadProgress(init.uploadUrl, body, mimeType, (loaded, total) => {
            const r = total > 0 ? loaded / total : 0
            const tWithin = 0.46 + 0.48 * Math.min(1, Math.max(0, r))
            emitUploadPercentThrottled(batchUploadOverallPercent(i, totalFiles, tWithin))
          })

          clearUploadPercentThrottle()
          patchUploadProgress({
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 0.96)),
          })

          await completeUploadMutation.mutateAsync({
            fileId: init.file.id,
            data: {
              fileIv: encryptedFile.fileIv,
              encryptedSizeBytes: encryptedFile.encryptedSizeBytes,
            },
          })

          patchUploadProgress({
            completedFiles: i + 1,
            percent: Math.round(batchUploadOverallPercent(i, totalFiles, 1)),
          })
        }

        patchUploadProgress({
          percent: 100,
          isDone: true,
        })
        setIsUploading(false)

        await refreshTree()
        toast.success(
          uploadableFiles.length === 1 ? 'Document uploaded' : `${uploadableFiles.length} documents uploaded`,
        )

        window.setTimeout(() => {
          patchUploadProgress('clear')
        }, 2000)

        return true
      } catch (error) {
        clearUploadPercentThrottle()
        setUploadProgress(null)
        toast.error(getErrorMessage(error, t('vault.documentsManager.uploadDocumentsFailedError')))
        return false
      } finally {
        setIsUploading(false)
      }
    },
    [
      canWrite,
      clearUploadPercentThrottle,
      completeUploadMutation,
      decryptedFiles.length,
      documentPlanLimits,
      emitUploadPercentThrottled,
      getDek,
      initUploadMutation,
      isSubscriptionLoading,
      patchUploadProgress,
      refreshTree,
      t,
      vault,
      vaultStorageUsedBytes,
    ],
  )

  const downloadFile = useCallback(
    async (file: DecryptedVaultDocumentFile) => {
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

  const { viewDocumentFile, documentViewer } = useVaultDocumentViewer<DecryptedVaultDocumentFile>({
    vault,
    getDek,
    downloadFile,
    t,
  })

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      try {
        await deleteFileMutation.mutateAsync(fileId)
        toast.success('Document deleted')
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to delete document'))
        return false
      }
    },
    [canWrite, deleteFileMutation, t],
  )

  const renameFile = useCallback(
    async (fileId: string, nextName: string) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      const normalizedName = nextName.trim()
      if (!normalizedName) {
        toast.error(t('vault.documentsManager.documentNameRequiredError'))
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error('Encryption keys not available')
          return false
        }
        const encrypted = await encryptDocumentName(normalizedName, dek, vault.id, vault.ownerId)
        await updateFileMutation.mutateAsync({
          fileId,
          data: {
            encryptedName: encrypted.encryptedName,
            nameIv: encrypted.nameIv,
          },
        })
        toast.success(t('vault.documentsManager.documentRenamedSuccess'))
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.documentsManager.renameDocumentFailedError')))
        return false
      }
    },
    [canWrite, getDek, t, updateFileMutation, vault],
  )

  const moveFilesToFolder = useCallback(
    async (fileIds: string[], destinationFolderId: string) => {
      if (!vault) {
        toast.error(t('vault.assets.attachments.vaultMissingError'))
        return false
      }
      if (!canWrite) {
        toast.error(t('vault.assets.attachments.documentsOwnerOnlyError'))
        return false
      }
      if (!destinationFolderId) {
        toast.error(t('vault.documentsManager.selectMoveDestinationError'))
        return false
      }

      const uniqueFileIds = Array.from(new Set(fileIds.filter(Boolean)))
      if (uniqueFileIds.length === 0) {
        return true
      }

      setIsMovingFiles(true)
      try {
        for (const fileId of uniqueFileIds) {
          await moveFileMutation.mutateAsync({
            fileId,
            data: {
              folderId: destinationFolderId,
            },
          })
        }
        await refreshTree()
        toast.success(
          t('vault.documentsManager.movedFilesSuccess', { count: uniqueFileIds.length }),
        )
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.documentsManager.moveFilesFailedError')))
        return false
      } finally {
        setIsMovingFiles(false)
      }
    },
    [canWrite, moveFileMutation, refreshTree, t, vault],
  )

  return {
    vault,
    isLoading: isVaultLoading || documentsTreeQuery.isLoading || isDecrypting,
    isDecrypting,
    isUploading,
    uploadProgress,
    dismissUploadProgress,
    isRefreshing: documentsTreeQuery.isFetching,
    canWrite,
    documentPlanLimits,
    folderCount: decryptedFolders.length,
    fileCount: decryptedFiles.length,
    vaultStorageUsedBytes,
    canCreateFolder,
    canUploadDocuments,
    folders: decryptedFolders,
    files: decryptedFiles,
    foldersByParent,
    visibleFiles,
    selectedFolderId,
    selectedFolder: selectedFolderId ? folderIndex.get(selectedFolderId) ?? null : null,
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
    documentViewer,
    deleteFile,
    refreshTree,
    isCreatingFolder: createFolderMutation.isPending,
    isRenamingFolder: updateFolderMutation.isPending,
    isRenamingFile: updateFileMutation.isPending,
    isMovingFiles,
    isDeletingFolder: deleteFolderMutation.isPending,
    isDeletingFile: deleteFileMutation.isPending,
  }
}
