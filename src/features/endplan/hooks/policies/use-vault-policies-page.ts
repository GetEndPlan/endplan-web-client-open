import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSubscription, resolvePolicyCategoriesMax, resolvePolicyRowsPerCategoryMax } from '@/features/billing'
import { useAuthUser } from '@/features/auth/session'
import {
  decryptPolicyAttachmentFile,
  decryptPolicyAttachmentName,
  decryptDocumentFile,
  encryptPolicyAttachmentFile,
  encryptPolicyAttachmentName,
  encryptDocumentFile,
  encryptDocumentName,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useKeyMaterial } from '@/features/keys'
import { toast } from '@/shared/ui'
import {
  useAddVaultPolicyCustomField,
  useCompleteVaultPolicyAttachmentUpload,
  useCompleteVaultDocumentUpload,
  useCreateVaultPolicyCustomCategory,
  useCreateVaultDocumentFolder,
  useCreateVaultSection,
  useDeleteVaultPolicyAttachment,
  useDeleteVaultPolicyCustomCategory,
  useDeleteVaultPolicyCustomField,
  useInitVaultPolicyAttachmentUpload,
  useInitVaultDocumentUpload,
  useUpdateVaultPolicyCategories,
  useUpdateVaultPolicyCustomCategory,
  useUpdateVaultPolicyField,
  useUpdateVaultSection,
} from '../../api/hooks/mutations/use-vault-mutations'
import {
  useVaultPolicyAttachments,
  useUserVault,
  useVaultPoliciesSchema,
  useVaultSections,
} from '../../api/hooks/queries/use-vault-queries'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import {
  vaultPoliciesApi,
  vaultDocumentsApi,
  type VaultPolicyAttachment,
  type VaultDocumentFile,
  type VaultDocumentFolder,
} from '../../api/clients/vault-api'
import { resolveAllowedDocumentMimeType } from '../../model/document-upload-policy'
import {
  checkFileUploadsAgainstPlan,
  checkFolderCreateAgainstPlan,
  resolveDocumentsPlanLimits,
  sumUploadedOriginalBytes,
} from '../../model/vault-documents-plan-guards'
import {
  collectKnownAttachmentIdsFromPayload,
  getAttachmentFieldKeysByCategory,
  getPasswordFieldKeysByCategory,
  serializeDocumentLinkRef,
} from '../../model/asset-attachment-ref'
import { getContactFieldKeysByCategory, serializeContactLinkRef } from '../../model/asset-contact-ref'
import { setAssetCellValue } from '../../model/asset-table-model'
import { SECTION_ID } from '../../model/vault-section-types'
import { useVaultPoliciesActions } from './use-vault-policies-actions'
import { useVaultPoliciesContactOptions } from './use-vault-policies-contact-options'
import { useVaultPoliciesHydration } from './use-vault-policies-hydration'
import { useVaultPoliciesPersistence } from './use-vault-policies-persistence'
import { useVaultPoliciesState } from './use-vault-policies-state'
import { useVaultDocumentsDecryptedTree } from '../documents/use-vault-documents-tree-decrypted'
import { useVaultDocumentViewer } from '../documents/use-vault-document-viewer'
import { decryptVaultPolicyAttachmentToBlob } from '../../lib/decrypt-vault-policy-attachment-blob'
import { pickActiveVaultDocumentViewer } from '../../lib/pick-active-vault-document-viewer'

export type DecryptedVaultPolicyAttachment = VaultPolicyAttachment & {
  name: string
}

export type DecryptedVaultDocumentFolderForPolicies = VaultDocumentFolder & {
  name: string
}

export type DecryptedVaultDocumentFileForPolicies = VaultDocumentFile & {
  name: string
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'apiMessage' in error) {
    const apiMessage = (error as { apiMessage?: string }).apiMessage
    if (apiMessage) return apiMessage
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function useVaultPoliciesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const { data: vault, isLoading: isVaultLoading } = useUserVault({ ownerUserId: user?.id })
  const { data: subscriptionResponse, isLoading: isSubscriptionLoading } = useSubscription({
    enabled: !!vault,
  })
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()

  const {
    data: sections = [],
    isLoading: isSectionsLoading,
    refetch: refetchSections,
  } = useVaultSections(vault?.id, {
    enabled: !!vault,
  })
  const assetsSection = sections.find((section) => section.sectionType === SECTION_ID.POLICIES) ?? null

  const {
    data: schema,
    isLoading: isSchemaLoading,
  } = useVaultPoliciesSchema(vault?.id, { enabled: !!vault })
  const attachmentsQuery = useVaultPolicyAttachments(vault?.id, { enabled: !!vault })
  const documentsTreeDecrypt = useVaultDocumentsDecryptedTree(vault)
  const decryptedDocumentsFolders =
    documentsTreeDecrypt.folders as DecryptedVaultDocumentFolderForPolicies[]
  const decryptedDocumentsFiles =
    documentsTreeDecrypt.files as DecryptedVaultDocumentFileForPolicies[]
  const documentsTreeQuery = documentsTreeDecrypt.documentsTreeQuery
  const isDecryptingDocuments = documentsTreeDecrypt.isDecrypting
  const categories = useMemo(() => schema?.categories ?? [], [schema?.categories])
  const { contactOptions, contactsById } = useVaultPoliciesContactOptions(vault)
  const attachmentFieldKeysByCategory = useMemo(
    () => getAttachmentFieldKeysByCategory(categories),
    [categories],
  )
  const passwordFieldKeysByCategory = useMemo(
    () => getPasswordFieldKeysByCategory(categories),
    [categories],
  )
  const contactFieldKeysByCategory = useMemo(
    () => getContactFieldKeysByCategory(categories),
    [categories],
  )

  const updateCategoriesMutation = useUpdateVaultPolicyCategories(vault?.id ?? '')
  const addCustomFieldMutation = useAddVaultPolicyCustomField(vault?.id ?? '')
  const createCustomCategoryMutation = useCreateVaultPolicyCustomCategory(vault?.id ?? '')
  const updateCustomCategoryMutation = useUpdateVaultPolicyCustomCategory(vault?.id ?? '')
  const updateFieldMutation = useUpdateVaultPolicyField(vault?.id ?? '')
  const deleteCustomFieldMutation = useDeleteVaultPolicyCustomField(vault?.id ?? '')
  const deleteCustomCategoryMutation = useDeleteVaultPolicyCustomCategory(vault?.id ?? '')
  const initAttachmentUploadMutation = useInitVaultPolicyAttachmentUpload(vault?.id ?? '')
  const completeAttachmentUploadMutation = useCompleteVaultPolicyAttachmentUpload(vault?.id ?? '')
  const deleteAttachmentMutation = useDeleteVaultPolicyAttachment(vault?.id ?? '')
  const createSectionMutation = useCreateVaultSection(vault?.id ?? '')
  const updateSectionMutation = useUpdateVaultSection(vault?.id ?? '', assetsSection?.id ?? '', {
    invalidateQueries: false,
  })
  const createVaultDocumentFolderMutation = useCreateVaultDocumentFolder(vault?.id ?? '')
  const initVaultDocumentUploadMutation = useInitVaultDocumentUpload(vault?.id ?? '')
  const completeVaultDocumentUploadMutation = useCompleteVaultDocumentUpload(vault?.id ?? '', {
    invalidateQueries: false,
  })

  const state = useVaultPoliciesState({
    vaultId: vault?.id ?? null,
  })

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  const [decryptedAttachments, setDecryptedAttachments] = useState<DecryptedVaultPolicyAttachment[]>([])
  const [isDecryptingAttachments, setIsDecryptingAttachments] = useState(false)
  const [activeAttachmentCellKey, setActiveAttachmentCellKey] = useState<string | null>(null)
  const attachmentsById = useMemo(
    () =>
      Object.fromEntries(
        decryptedAttachments.map((attachment) => [attachment.id, attachment]),
      ) as Record<string, DecryptedVaultPolicyAttachment>,
    [decryptedAttachments],
  )
  const documentsFilesById = useMemo(
    () =>
      Object.fromEntries(
        decryptedDocumentsFiles.map((file) => [file.id, file]),
      ) as Record<string, DecryptedVaultDocumentFileForPolicies>,
    [decryptedDocumentsFiles],
  )
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
  const policyCategoriesMax = useMemo(
    () =>
      resolvePolicyCategoriesMax({
        features: subscriptionResponse?.features,
        schemaMax: schema?.policyCategoriesMax,
        tier: subscriptionResponse?.subscription?.tier,
        inTrial: subscriptionResponse?.inTrial,
        hasActiveSubscription: subscriptionResponse?.hasActiveSubscription,
        canAccess: subscriptionResponse?.canAccess,
      }),
    [
      schema?.policyCategoriesMax,
      subscriptionResponse?.canAccess,
      subscriptionResponse?.features,
      subscriptionResponse?.hasActiveSubscription,
      subscriptionResponse?.inTrial,
      subscriptionResponse?.subscription?.tier,
    ],
  )
  const assetRowsPerCategoryMax = useMemo(
    () =>
      resolvePolicyRowsPerCategoryMax({
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
    () =>
      sumUploadedOriginalBytes(decryptedDocumentsFiles) +
      sumUploadedOriginalBytes(decryptedAttachments),
    [decryptedAttachments, decryptedDocumentsFiles],
  )
  const maxAttachmentSizeBytes = documentPlanLimits?.fileSizeMaxBytes ?? null
  const canManageDocuments = useMemo(
    () => Boolean(vault && user && vault.ownerId === user.id),
    [user, vault],
  )
  const [isUploadingVaultDocument, setIsUploadingVaultDocument] = useState(false)

  const hydration = useVaultPoliciesHydration({
    vault,
    assetsSection,
    schemaCategories: categories,
    schemaSelectedCategoryIds: schema?.selectedCategoryIds ?? [],
    isSchemaLoaded: !isSchemaLoading,
    pendingSnapshot: state.pendingSnapshot,
    isPendingSnapshotLoaded: state.isPendingSnapshotLoaded,
    publicKeyB64,
    privateKeyB64,
    getDek,
    setSelectedCategoryIds: state.setSelectedCategoryIds,
    setPayload: state.setPayload,
    setIsDecrypting: state.setIsDecrypting,
    setHasInitiallyLoaded: state.setHasInitiallyLoaded,
    setPendingSnapshot: state.setPendingSnapshot,
    refs: state.refs,
  })

  const persistence = useVaultPoliciesPersistence({
    vault,
    assetsSection,
    schemaCategories: categories,
    selectedCategoryIds: state.selectedCategoryIds,
    payload: state.payload,
    pendingSnapshot: state.pendingSnapshot,
    isPendingSnapshotLoaded: state.isPendingSnapshotLoaded,
    hasInitiallyLoaded: state.hasInitiallyLoaded,
    canPersist: hydration.canPersist,
    isOffline: state.isOffline,
    setIsOffline: state.setIsOffline,
    setPendingSnapshot: state.setPendingSnapshot,
    setSaveApiCallCount: state.setSaveApiCallCount,
    getDek,
    refetchSections,
    createSectionMutation,
    updateSectionMutation,
    onAfterPersistSuccess: async ({ previousPayload, nextPayload }) => {
      if (vault?.id) {
        await queryClient.invalidateQueries({ queryKey: vaultKeys.netWorthRoot(vault.id) })
      }
      if (!previousPayload) return
      const knownAttachmentIds = new Set(Object.keys(attachmentsById))
      const previousIds = collectKnownAttachmentIdsFromPayload(previousPayload, knownAttachmentIds)
      const nextIds = collectKnownAttachmentIdsFromPayload(nextPayload, knownAttachmentIds)
      const removedIds = Array.from(previousIds).filter((id) => !nextIds.has(id))
      if (removedIds.length === 0) return
      await Promise.allSettled(
        removedIds.map((attachmentId) => deleteAttachmentMutation.mutateAsync(attachmentId)),
      )
    },
    assetRowsPerCategoryMax,
    refs: state.refs,
  })

  const actions = useVaultPoliciesActions({
    vault,
    categories,
    selectedCategoryIds: state.selectedCategoryIds,
    setSelectedCategoryIds: state.setSelectedCategoryIds,
    payload: state.payload,
    setPayload: state.setPayload,
    markDirty: persistence.markDirty,
    clearDirty: persistence.clearDirty,
    saveAssets: persistence.saveAssets,
    canPersistAssets: hydration.canPersist,
    hasInitiallyLoaded: state.hasInitiallyLoaded,
    policyCategoriesMax: policyCategoriesMax > 0 ? policyCategoriesMax : null,
    assetRowsPerCategoryMax,
    updateCategoriesMutation,
    addCustomFieldMutation,
    createCustomCategoryMutation,
    updateFieldMutation,
    updateCustomCategoryMutation,
    deleteCustomFieldMutation,
    deleteCustomCategoryMutation,
  })

  useEffect(() => {
    if (!attachmentsQuery.data || !vault) {
      setDecryptedAttachments([])
      return
    }

    const attachments = Array.isArray(attachmentsQuery.data.attachments)
      ? attachmentsQuery.data.attachments
      : []
    let cancelled = false
    setIsDecryptingAttachments(true)

    getDek()
      .then(async (dek) => {
        if (!dek) return null
        return Promise.all(
          attachments.map(async (attachment) => ({
            ...attachment,
            name: await decryptPolicyAttachmentName(
              attachment.encryptedName,
              attachment.nameIv,
              dek,
              vault.id,
              vault.ownerId,
            ),
          })),
        )
      })
      .then((decoded) => {
        if (cancelled) return
        if (!decoded) {
          setDecryptedAttachments(
            attachments.map((attachment) => ({
              ...attachment,
              name: t('vault.policies.attachments.encryptedFallbackName'),
            })),
          )
          setIsDecryptingAttachments(false)
          return
        }
        setDecryptedAttachments(decoded)
        setIsDecryptingAttachments(false)
      })
      .catch(() => {
        if (cancelled) return
        setDecryptedAttachments(
          attachments.map((attachment) => ({
            ...attachment,
            name: t('vault.policies.attachments.encryptedFallbackName'),
          })),
        )
        setIsDecryptingAttachments(false)
      })

    return () => {
      cancelled = true
    }
  }, [attachmentsQuery.data, getDek, t, vault])

  const downloadAttachment = useCallback(
    async (attachment: DecryptedVaultPolicyAttachment) => {
      if (!vault) {
        toast.error(t('vault.policies.attachments.vaultMissingError'))
        return false
      }
      if (!attachment.fileIv) {
        toast.error(t('vault.policies.attachments.downloadNotReadyError'))
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error(t('vault.policies.attachments.keysUnavailableError'))
          return false
        }
        const payload = await vaultPoliciesApi.getAttachmentDownloadURL(vault.id, attachment.id)
        const encryptedRes = await fetch(payload.downloadUrl)
        if (!encryptedRes.ok) {
          throw new Error(`Download failed (${encryptedRes.status})`)
        }
        const encryptedBytes = new Uint8Array(await encryptedRes.arrayBuffer())
        const decrypted = await decryptPolicyAttachmentFile(
          encryptedBytes,
          payload.attachment.fileIv ?? attachment.fileIv,
          dek,
          vault.id,
          vault.ownerId,
        )
        const blob = new Blob([new Uint8Array(decrypted)], {
          type: attachment.mimeType || 'application/octet-stream',
        })
        const objectURL = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectURL
        link.download = attachment.name || t('vault.policies.attachments.downloadNameFallback')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(objectURL), 500)
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.policies.attachments.downloadFailedError')))
        return false
      }
    },
    [getDek, t, vault],
  )

  const downloadLinkedDocument = useCallback(
    async (file: DecryptedVaultDocumentFileForPolicies) => {
      if (!vault) {
        toast.error(t('vault.policies.attachments.vaultMissingError'))
        return false
      }
      if (!file.fileIv) {
        toast.error(t('vault.policies.attachments.downloadNotReadyError'))
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error(t('vault.policies.attachments.keysUnavailableError'))
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
        const blob = new Blob([new Uint8Array(decrypted)], {
          type: file.mimeType || 'application/octet-stream',
        })
        const objectURL = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectURL
        link.download = file.name || t('vault.policies.attachments.downloadNameFallback')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(objectURL), 500)
        return true
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.policies.attachments.downloadFailedError')))
        return false
      }
    },
    [getDek, t, vault],
  )

  const {
    viewDocumentFile: viewLinkedDocument,
    documentViewer: linkedDocumentViewer,
  } = useVaultDocumentViewer<DecryptedVaultDocumentFileForPolicies>({
    vault,
    getDek,
    downloadFile: downloadLinkedDocument,
    t,
  })

  const {
    viewDocumentFile: viewAttachment,
    documentViewer: attachmentViewer,
  } = useVaultDocumentViewer<DecryptedVaultPolicyAttachment>({
    vault,
    getDek,
    downloadFile: downloadAttachment,
    decryptToBlob: decryptVaultPolicyAttachmentToBlob,
    t,
  })

  const documentViewer = useMemo(
    () => pickActiveVaultDocumentViewer(linkedDocumentViewer, attachmentViewer),
    [attachmentViewer, linkedDocumentViewer],
  )

  const linkDocument = useCallback(
    async (input: {
      categoryTemplateId: string
      rowId: string
      fieldKey: string
      file: {
        id: string
        name: string
        folderId?: string | null
      }
    }) => {
      const nextPayload = setAssetCellValue(
        state.payload,
        input.categoryTemplateId,
        input.rowId,
        input.fieldKey,
        serializeDocumentLinkRef({
          fileId: input.file.id,
          fileName: input.file.name,
          folderId: input.file.folderId ?? null,
        }),
      )
      state.setPayload(nextPayload)
      persistence.markDirty()
      toast.success(t('vault.policies.attachments.linkedSuccess'))
      return true
    },
    [persistence, state, t],
  )

  const refreshDocumentsTree = useCallback(async () => {
    if (!vault?.id) return
    await queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vault.id) })
  }, [queryClient, vault?.id])

  const createDocumentsFolder = useCallback(
    async (name: string, parentFolderId: string | null) => {
      if (!vault) {
        toast.error(t('vault.policies.attachments.vaultMissingError'))
        return null
      }
      if (!canManageDocuments) {
        toast.error(t('vault.policies.attachments.documentsOwnerOnlyError'))
        return null
      }
      const normalizedName = name.trim()
      if (!normalizedName) {
        toast.error(t('vault.policies.attachments.folderNameRequiredError'))
        return null
      }
      const folderPlanBlock = checkFolderCreateAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFolderCount: decryptedDocumentsFolders.length,
      })
      if (folderPlanBlock === 'subscription_loading') {
        toast.error(t('vault.documentsManager.planLimitsLoadingError'))
        return null
      }
      if (folderPlanBlock === 'folder_limit') {
        toast.error(t('vault.documentsManager.folderLimitReachedError', { max: documentPlanLimits.foldersMax }))
        return null
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error(t('vault.policies.attachments.keysUnavailableError'))
          return null
        }
        const encrypted = await encryptDocumentName(normalizedName, dek, vault.id, vault.ownerId)
        const created = await createVaultDocumentFolderMutation.mutateAsync({
          parentFolderId: parentFolderId ?? undefined,
          encryptedName: encrypted.encryptedName,
          nameIv: encrypted.nameIv,
        })
        await refreshDocumentsTree()
        toast.success(t('vault.policies.attachments.folderCreatedSuccess'))
        return created.id
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.policies.attachments.createFolderFailedError')))
        return null
      }
    },
    [
      canManageDocuments,
      createVaultDocumentFolderMutation,
      decryptedDocumentsFolders.length,
      documentPlanLimits,
      getDek,
      isSubscriptionLoading,
      refreshDocumentsTree,
      t,
      vault,
    ],
  )

  const uploadDocumentToFolder = useCallback(
    async (
      folderId: string,
      file: File,
    ): Promise<{ id: string; name: string; folderId: string | null } | null> => {
      if (!vault) {
        toast.error(t('vault.policies.attachments.vaultMissingError'))
        return null
      }
      if (!canManageDocuments) {
        toast.error(t('vault.policies.attachments.documentsOwnerOnlyError'))
        return null
      }
      if (state.isOffline) {
        toast.error(t('vault.policies.attachments.offlineUploadError'))
        return null
      }
      if (!folderId) {
        toast.error(t('vault.documentsManager.selectFolderBeforeUploadError'))
        return null
      }
      const uploadPlanBlock = checkFileUploadsAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFileCount: decryptedDocumentsFiles.length,
        currentTotalSizeBytes: vaultStorageUsedBytes,
        files: [{ name: file.name, size: file.size }],
      })
      if (uploadPlanBlock?.kind === 'subscription_loading') {
        toast.error(t('vault.documentsManager.planLimitsLoadingError'))
        return null
      }
      if (uploadPlanBlock?.kind === 'file_limit') {
        toast.error(
          t('vault.documentsManager.fileLimitReachedError', {
            max: uploadPlanBlock.max,
            current: uploadPlanBlock.current,
            adding: uploadPlanBlock.adding,
          }),
        )
        return null
      }
      if (uploadPlanBlock?.kind === 'file_size') {
        toast.error(
          t('vault.documentsManager.fileExceedsPlanLimit', {
            name: uploadPlanBlock.fileName,
            size: formatBytes(uploadPlanBlock.maxBytes),
          }),
        )
        return null
      }
      if (uploadPlanBlock?.kind === 'total_storage') {
        toast.error(
          t('vault.documentsManager.totalStorageLimitReachedError', {
            defaultValue: 'Total document storage limit reached for your plan.',
          }),
        )
        return null
      }
      const mimeType = resolveAllowedDocumentMimeType(file)
      if (!mimeType) {
        toast.error(t('vault.policies.attachments.unsupportedTypeError'))
        return null
      }
      const dek = await getDek()
      if (!dek) {
        toast.error(t('vault.policies.attachments.keysUnavailableError'))
        return null
      }

      setIsUploadingVaultDocument(true)
      try {
        const encryptedName = await encryptDocumentName(file.name, dek, vault.id, vault.ownerId)
        const init = await initVaultDocumentUploadMutation.mutateAsync({
          folderId,
          encryptedName: encryptedName.encryptedName,
          nameIv: encryptedName.nameIv,
          mimeType,
          originalSizeBytes: file.size,
        })

        const encryptedFile = await encryptDocumentFile(file, dek, vault.id, vault.ownerId)
        const uploadRes = await fetch(init.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
          },
          body: new Blob([new Uint8Array(encryptedFile.encryptedBytes)], {
            type: mimeType,
          }),
        })
        if (!uploadRes.ok) {
          throw new Error(`Upload failed (${uploadRes.status})`)
        }

        await completeVaultDocumentUploadMutation.mutateAsync({
          fileId: init.file.id,
          data: {
            fileIv: encryptedFile.fileIv,
            encryptedSizeBytes: encryptedFile.encryptedSizeBytes,
          },
        })

        await refreshDocumentsTree()
        toast.success(t('vault.policies.attachments.vaultDocumentUploadedSuccess'))
        return {
          id: init.file.id,
          name: file.name,
          folderId,
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('vault.policies.attachments.vaultDocumentUploadFailedError')))
        return null
      } finally {
        setIsUploadingVaultDocument(false)
      }
    },
    [
      canManageDocuments,
      completeVaultDocumentUploadMutation,
      decryptedDocumentsFiles.length,
      documentPlanLimits,
      getDek,
      initVaultDocumentUploadMutation,
      isSubscriptionLoading,
      refreshDocumentsTree,
      state.isOffline,
      t,
      vault,
      vaultStorageUsedBytes,
    ],
  )

  const uploadAttachment = useCallback(
    async (input: {
      categoryTemplateId: string
      rowId: string
      fieldKey: string
      file: File
    }) => {
      if (!vault) {
        toast.error(t('vault.policies.attachments.vaultMissingError'))
        return false
      }
      if (state.isOffline) {
        toast.error(t('vault.policies.attachments.offlineUploadError'))
        return false
      }
      if (maxAttachmentSizeBytes && input.file.size > maxAttachmentSizeBytes) {
        toast.error(
          t('vault.policies.attachments.maxSizeExceededError', {
            size: formatBytes(maxAttachmentSizeBytes),
          }),
        )
        return false
      }
      const mimeType = resolveAllowedDocumentMimeType(input.file)
      if (!mimeType) {
        toast.error(t('vault.policies.attachments.unsupportedTypeError'))
        return false
      }
      const dek = await getDek()
      if (!dek) {
        toast.error(t('vault.policies.attachments.keysUnavailableError'))
        return false
      }

      const cellKey = `${input.categoryTemplateId}:${input.rowId}:${input.fieldKey}`
      const currentValue =
        state.payload.categories
          .find((category) => category.categoryTemplateId === input.categoryTemplateId)
          ?.rows.find((row) => row.id === input.rowId)
          ?.values[input.fieldKey] ?? ''

      setActiveAttachmentCellKey(cellKey)
      let nextAttachmentId: string | null = null
      try {
        const encryptedName = await encryptPolicyAttachmentName(
          input.file.name,
          dek,
          vault.id,
          vault.ownerId,
        )
        const init = await initAttachmentUploadMutation.mutateAsync({
          categoryTemplateId: input.categoryTemplateId,
          rowId: input.rowId,
          fieldKey: input.fieldKey,
          encryptedName: encryptedName.encryptedName,
          nameIv: encryptedName.nameIv,
          mimeType,
          originalSizeBytes: input.file.size,
        })
        nextAttachmentId = init.attachment.id

        const encryptedFile = await encryptPolicyAttachmentFile(
          input.file,
          dek,
          vault.id,
          vault.ownerId,
        )
        const uploadRes = await fetch(init.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
          },
          body: new Blob([new Uint8Array(encryptedFile.encryptedBytes)], {
            type: mimeType,
          }),
        })
        if (!uploadRes.ok) {
          throw new Error(`Upload failed (${uploadRes.status})`)
        }

        await completeAttachmentUploadMutation.mutateAsync({
          attachmentId: init.attachment.id,
          data: {
            fileIv: encryptedFile.fileIv,
            encryptedSizeBytes: encryptedFile.encryptedSizeBytes,
          },
        })

        const nextPayload = setAssetCellValue(
          state.payload,
          input.categoryTemplateId,
          input.rowId,
          input.fieldKey,
          init.attachment.id,
        )
        state.setPayload(nextPayload)
        persistence.markDirty()
        const ok = await persistence.saveAssets(nextPayload)
        if (!ok) {
          state.setPayload((current) =>
            setAssetCellValue(
              current,
              input.categoryTemplateId,
              input.rowId,
              input.fieldKey,
              currentValue,
            ),
          )
          persistence.markDirty()
          await deleteAttachmentMutation.mutateAsync(init.attachment.id)
          return false
        }

        toast.success(t('vault.policies.attachments.uploadedSuccess'))
        return true
      } catch (error) {
        if (nextAttachmentId) {
          await deleteAttachmentMutation.mutateAsync(nextAttachmentId).catch(() => undefined)
        }
        toast.error(getErrorMessage(error, t('vault.policies.attachments.uploadFailedError')))
        return false
      } finally {
        setActiveAttachmentCellKey((current) => (current === cellKey ? null : current))
      }
    },
    [
      completeAttachmentUploadMutation,
      deleteAttachmentMutation,
      getDek,
      initAttachmentUploadMutation,
      maxAttachmentSizeBytes,
      persistence,
      state,
      t,
      vault,
    ],
  )

  const clearAttachment = useCallback(
    (input: { categoryTemplateId: string; rowId: string; fieldKey: string }) => {
      actions.setCellValue(input.categoryTemplateId, input.rowId, input.fieldKey, '')
    },
    [actions],
  )

  const linkContact = useCallback(
    async (input: {
      categoryTemplateId: string
      rowId: string
      fieldKey: string
      contact: { id: string; label: string }
    }) => {
      const nextPayload = setAssetCellValue(
        state.payload,
        input.categoryTemplateId,
        input.rowId,
        input.fieldKey,
        serializeContactLinkRef({
          contactId: input.contact.id,
          displayName: input.contact.label,
        }),
      )
      state.setPayload(nextPayload)
      persistence.markDirty()
      toast.success(t('vault.policies.contacts.linkedSuccess'))
      return true
    },
    [persistence, state, t],
  )

  const clearContact = useCallback(
    (input: { categoryTemplateId: string; rowId: string; fieldKey: string }) => {
      actions.setCellValue(input.categoryTemplateId, input.rowId, input.fieldKey, '')
    },
    [actions],
  )

  const isLoading =
    hydration.hydrationStatus === 'loading' ||
    (!!vault &&
      !hydration.canPersist &&
      hydration.hydrationStatus !== 'error' &&
      (isVaultLoading ||
        isSectionsLoading ||
        isSchemaLoading ||
        !state.isPendingSnapshotLoaded ||
        !publicKeyB64 ||
        !privateKeyB64)) ||
    (hydration.hydrationStatus === 'idle' &&
      (isVaultLoading || isSectionsLoading || isSchemaLoading || state.isDecrypting))

  return {
    vault,
    categories,
    selectedCategoryIds: state.selectedCategoryIds,
    setSelectedCategoryIds: state.setSelectedCategoryIds,
    policyCategoriesMax,
    assetRowsPerCategoryMax,
    isLoading,
    canPersistAssets: hydration.canPersist,
    hydrationStatus: hydration.hydrationStatus,
    hydrationErrorKey: hydration.hydrationErrorKey,
    retryAssetsHydration: hydration.retryHydration,
    isSavingCategories: updateCategoriesMutation.isPending,
    isSavingAssets: createSectionMutation.isPending || updateSectionMutation.isPending,
    isAddingCustomField: addCustomFieldMutation.isPending,
    isDeletingCustomField: deleteCustomFieldMutation.isPending,
    isDeletingCustomCategory: deleteCustomCategoryMutation.isPending,
    isCreatingCustomCategory: createCustomCategoryMutation.isPending,
    isUpdatingCustomCategory: updateCustomCategoryMutation.isPending,
    isUpdatingField: updateFieldMutation.isPending,
    isAttachmentsLoading:
      attachmentsQuery.isLoading ||
      isDecryptingAttachments ||
      documentsTreeQuery.isLoading ||
      isDecryptingDocuments,
    autosaveStatus: persistence.autosaveStatus,
    lastSavedAt: persistence.lastSavedAt,
    saveApiCallCount: state.saveApiCallCount,
    isOffline: state.isOffline,
    attachmentsById,
    documentsFolders: decryptedDocumentsFolders,
    documentsFiles: decryptedDocumentsFiles,
    documentsFilesById,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    contactFieldKeysByCategory,
    activeAttachmentCellKey,
    getRows: actions.getRows,
    addRow: actions.addRow,
    removeRow: actions.removeRow,
    setCellValue: actions.setCellValue,
    setEditorActive: persistence.setEditorActive,
    persistSelectedCategories: actions.persistSelectedCategories,
    createCustomCategory: actions.createCustomCategory,
    addCustomField: actions.addCustomField,
    renameField: actions.renameField,
    renameCustomCategory: actions.renameCustomCategory,
    deleteCustomCategory: actions.deleteCustomCategory,
    deleteCustomField: actions.deleteCustomField,
    uploadAttachment,
    downloadAttachment,
    downloadLinkedDocument,
    viewLinkedDocument,
    viewAttachment,
    documentViewer,
    linkDocument,
    clearAttachment,
    contactOptions,
    contactsById,
    linkContact,
    clearContact,
    saveAssets: persistence.saveAssets,
    canManageDocuments,
    createDocumentsFolder,
    uploadDocumentToFolder,
    isVaultDocumentsActionBusy:
      isUploadingVaultDocument || createVaultDocumentFolderMutation.isPending,
  }
}
