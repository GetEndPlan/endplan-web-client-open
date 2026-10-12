import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import {
  decryptDocumentFile,
  encryptDocumentFile,
  encryptDocumentName,
  decryptSectionContent,
  encryptSectionContent,
  fetchBlobAsBase64,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useQueryClient } from '@tanstack/react-query'
import { useSubscription, resolveInstructionsMax } from '@/features/billing'
import { useKeyMaterial } from '@/features/keys'
import { useAuthUser } from '@/features/auth/session'
import { toast } from '@/shared/ui'
import {
  useCompleteVaultDocumentUpload,
  useCreateVaultDocumentFolder,
  useDeleteVaultInstructions,
  useInitVaultDocumentUpload,
  useUpsertVaultInstructions,
} from '../../api/hooks/mutations/use-vault-mutations'
import { useUserVault, useVaultContacts, useVaultInstructions, useVaultSections } from '../../api/hooks/queries/use-vault-queries'
import { vaultDocumentsApi } from '../../api/clients/vault-api'
import {
  emptyInstructionsPayload,
  normalizeInstructionsPayload,
  type InstructionItem,
  type InstructionsSectionPayload,
} from '../../model/instructions'
import {
  contactRoleDisplayLabel,
  normalizeContactsPayload,
  type ContactRole,
} from '../../model/contacts'
import { SECTION_ID } from '../../model/vault-section-types'
import { resolveAllowedDocumentMimeType } from '../../model/document-upload-policy'
import {
  checkFileUploadsAgainstPlan,
  checkFolderCreateAgainstPlan,
  resolveDocumentsPlanLimits,
  sumUploadedOriginalBytes,
} from '../../model/vault-documents-plan-guards'
import { canAddInstruction, checkInstructionsAgainstPlan } from '../../model/plan-quota-guards'
import type { InstructionFormState } from '../../model/instructions-form-state'
import type { InstructionUpsertResult } from '../../model/instructions-page.types'
import type {
  InstructionAssetOption,
  InstructionContactOption,
  InstructionDocumentFolderOption,
  InstructionDocumentOption,
} from '../../model/instructions-page.types'
import { useVaultDocumentsDecryptedTree } from '../documents/use-vault-documents-tree-decrypted'
import { useVaultDocumentViewer } from '../documents/use-vault-document-viewer'

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function useVaultInstructionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const { data: vault, isLoading: isVaultLoading } = useUserVault({ ownerUserId: user?.id })
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
  const instructionsMax = useMemo(
    () =>
      resolveInstructionsMax({
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
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: !!vault })
  const {
    data: sections = [],
    isLoading: isSectionsLoading,
  } = useVaultSections(vault?.id, { enabled: !!vault })
  const instructionsQuery = useVaultInstructions(vault?.id, { enabled: !!vault })
  const { folders: decryptedDocFolders, files: decryptedDocFiles, documentsTreeQuery } =
    useVaultDocumentsDecryptedTree(vault)
  const isDocumentsLoading = documentsTreeQuery.isLoading

  const [isDecrypting, setIsDecrypting] = useState(false)
  const [instructionsPayload, setInstructionsPayload] = useState<InstructionsSectionPayload>(
    emptyInstructionsPayload(),
  )
  const canAddMoreInstructions = useMemo(
    () =>
      canAddInstruction({
        instructionsMax,
        currentCount: instructionsPayload.items.length,
      }),
    [instructionsMax, instructionsPayload.items.length],
  )
  const [assetOptions, setAssetOptions] = useState<InstructionAssetOption[]>([])
  const [contactOptions, setContactOptions] = useState<InstructionContactOption[]>([])

  const contactsQuery = useVaultContacts(vault?.id, { enabled: !!vault })
  const contactsSection = useMemo(() => contactsQuery.data ?? null, [contactsQuery.data])

  const contactRoleLabels = useMemo(() => {
    const labels = {} as Record<ContactRole, string>
    for (const role of [
      'lawyer',
      'doctor',
      'financial_manager',
      'power_of_attorney',
      'other',
    ] as const) {
      labels[role] = t(`vault.contacts.roles.${role}`)
    }
    return labels
  }, [t])

  const documentFolders = useMemo((): InstructionDocumentFolderOption[] => {
    return decryptedDocFolders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentFolderId: folder.parentFolderId ?? null,
    }))
  }, [decryptedDocFolders])

  const documentOptions = useMemo((): InstructionDocumentOption[] => {
    return decryptedDocFiles.map((file) => {
      const subtitle = [
        file.mimeType ?? '',
        file.originalSizeBytes > 0 ? `${Math.round(file.originalSizeBytes / 1024)} KB` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      return {
        id: file.id,
        name: file.name,
        subtitle,
        sizeBytes: file.originalSizeBytes,
        folderId: file.folderId ?? null,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        fileIv: file.fileIv,
      }
    })
  }, [decryptedDocFiles])

  const vaultDocumentStorageUsedBytes = useMemo(
    () => sumUploadedOriginalBytes(documentOptions),
    [documentOptions],
  )

  const instructionsSection = useMemo(() => instructionsQuery.data ?? null, [instructionsQuery.data])
  const assetsSection = useMemo(
    () => sections.find((section) => section.sectionType === SECTION_ID.ASSETS) ?? null,
    [sections],
  )
  const isOwner = !!vault && !!user && vault.ownerId === user.id

  const upsertInstructionsMutation = useUpsertVaultInstructions(vault?.id ?? '')
  const deleteInstructionsMutation = useDeleteVaultInstructions(vault?.id ?? '')
  const createFolderMutation = useCreateVaultDocumentFolder(vault?.id ?? '')
  const initUploadMutation = useInitVaultDocumentUpload(vault?.id ?? '')
  const completeUploadMutation = useCompleteVaultDocumentUpload(vault?.id ?? '', {
    invalidateQueries: false,
  })

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  useEffect(() => {
    let cancelled = false

    async function hydrateInstructionsAndAssets() {
      if (!vault || !publicKeyB64 || !privateKeyB64) {
        if (!cancelled) {
          setInstructionsPayload(emptyInstructionsPayload())
          setAssetOptions([])
          setContactOptions([])
        }
        return
      }
      setIsDecrypting(true)
      try {
        const dek = await getDek()
        if (!dek || cancelled) return

        if (instructionsSection?.encryptionIv) {
          const encryptedData = instructionsSection.blobUrl
            ? await fetchBlobAsBase64(instructionsSection.blobUrl)
            : (instructionsSection.encryptedData ?? '')
          const decoded = await decryptSectionContent(
            encryptedData,
            instructionsSection.encryptionIv,
            dek,
            vault.id,
            vault.ownerId,
            SECTION_ID.INSTRUCTIONS,
          )
          if (!cancelled) {
            setInstructionsPayload(normalizeInstructionsPayload(decoded))
          }
        } else if (!cancelled) {
          setInstructionsPayload(emptyInstructionsPayload())
        }

        if (assetsSection) {
          const encryptedAssets = assetsSection.blobUrl
            ? await fetchBlobAsBase64(assetsSection.blobUrl)
            : (assetsSection.encryptedData ?? '')
          const decodedAssets = await decryptSectionContent<{
            categories?: Array<{ categoryName?: string; rows?: Array<{ id?: string; values?: Record<string, unknown> }> }>
          }>(encryptedAssets, assetsSection.encryptionIv, dek, vault.id, vault.ownerId, SECTION_ID.ASSETS)
          const nextAssetOptions: InstructionAssetOption[] = []
          for (const category of decodedAssets?.categories ?? []) {
            const categoryName = typeof category.categoryName === 'string' ? category.categoryName : ''
            for (const row of category.rows ?? []) {
              const rowID = typeof row.id === 'string' ? row.id : ''
              if (!rowID) continue
              const values = row.values ?? {}
              const assetName = typeof values.asset_name === 'string' ? values.asset_name.trim() : ''
              const name = typeof values.name === 'string' ? values.name.trim() : ''
              const institution = typeof values.institution === 'string' ? values.institution.trim() : ''
              const accountNumber = typeof values.account_number === 'string' ? values.account_number.trim() : ''
              const notes = typeof values.notes === 'string' ? values.notes.trim() : ''

              // Assets can contain categories and blank rows before the user fills anything out.
              // Those rows should not appear as linkable options in the instructions flow.
              const hasMeaningfulContent = Boolean(assetName || name || institution || accountNumber || notes)
              if (!hasMeaningfulContent) continue

              const label =
                assetName ||
                name ||
                institution ||
                t('vault.instructions.noSubtitle')
              const subtitleParts = [
                categoryName,
                label !== institution ? institution : '',
                accountNumber,
              ].filter(Boolean)
              nextAssetOptions.push({
                id: rowID,
                label,
                subtitle: subtitleParts.join(' · '),
              })
            }
          }
          if (!cancelled) {
            setAssetOptions(nextAssetOptions)
          }
        } else if (!cancelled) {
          setAssetOptions([])
        }

        if (contactsSection?.encryptionIv) {
          const encryptedContacts = contactsSection.blobUrl
            ? await fetchBlobAsBase64(contactsSection.blobUrl)
            : (contactsSection.encryptedData ?? '')
          const decodedContacts = await decryptSectionContent(
            encryptedContacts,
            contactsSection.encryptionIv,
            dek,
            vault.id,
            vault.ownerId,
            SECTION_ID.CONTACTS,
          )
          const nextContactOptions: InstructionContactOption[] = normalizeContactsPayload(decodedContacts).items.map(
            (contact) => ({
              id: contact.id,
              label: contact.fullName,
              subtitle: contactRoleDisplayLabel(contact, contactRoleLabels),
            }),
          )
          if (!cancelled) {
            setContactOptions(nextContactOptions)
          }
        } else if (!cancelled) {
          setContactOptions([])
        }
      } catch {
        if (!cancelled) {
          setInstructionsPayload(emptyInstructionsPayload())
          setAssetOptions([])
          setContactOptions([])
        }
      } finally {
        if (!cancelled) setIsDecrypting(false)
      }
    }

    void hydrateInstructionsAndAssets()
    return () => {
      cancelled = true
    }
  }, [
    assetsSection,
    contactRoleLabels,
    contactsSection,
    getDek,
    instructionsSection,
    privateKeyB64,
    publicKeyB64,
    t,
    vault,
  ])

  const refreshDocumentsTree = useCallback(async () => {
    if (!vault) return
    await queryClient.invalidateQueries({ queryKey: vaultKeys.documentsTree(vault.id) })
  }, [queryClient, vault])

  const persistPayload = useCallback(
    async (
      nextPayload: InstructionsSectionPayload,
      activityChange: 'added' | 'updated',
    ) => {
      if (!vault) return false
      const dek = await getDek()
      if (!dek) {
        toast.error(t('vault.instructions.toast.encryptionKeysUnavailable'))
        return false
      }

      const { encryptedData, encryptionIv } = await encryptSectionContent(
        nextPayload,
        dek,
        vault.id,
        vault.ownerId,
        SECTION_ID.INSTRUCTIONS,
      )

      try {
        await upsertInstructionsMutation.mutateAsync({
          encryptedData,
          encryptionIv,
          expectedVersion: instructionsSection?.version,
          itemCount: nextPayload.items.length,
          activityChange,
        })
        await instructionsQuery.refetch()
        setInstructionsPayload(nextPayload)
        return true
      } catch (error) {
        const message =
          error instanceof ApiError ? error.apiMessage ?? t('vault.instructions.toast.saveFailed') : t('vault.instructions.toast.saveFailed')
        toast.error(message)
        return false
      }
    },
    [
      getDek,
      instructionsQuery,
      instructionsSection,
      upsertInstructionsMutation,
      t,
      vault,
    ],
  )

  const upsertInstruction = useCallback(
    async (input: InstructionFormState): Promise<InstructionUpsertResult> => {
      const nowISO = new Date().toISOString()
      const isExisting = Boolean(input.id && instructionsPayload.items.some((item) => item.id === input.id))
      const nextItem: InstructionItem = {
        id: input.id ?? crypto.randomUUID(),
        title: input.title.trim(),
        instructionType: input.instructionType,
        noteBody: input.noteBody,
        steps: input.steps.filter((step) => step.text.trim().length > 0 || step.title.trim().length > 0),
        linkedAssetIds: input.linkedAssetIds,
        attachedDocumentId: input.attachedDocumentId,
        linkedContactId: input.linkedContactId,
        createdAt:
          instructionsPayload.items.find((item) => item.id === input.id)?.createdAt ?? nowISO,
        updatedAt: nowISO,
      }

      const nextPayload: InstructionsSectionPayload = {
        schemaVersion: 1,
        items: isExisting
          ? instructionsPayload.items.map((item) => (item.id === nextItem.id ? nextItem : item))
          : [nextItem, ...instructionsPayload.items],
      }

      const instructionsBlock = checkInstructionsAgainstPlan({
        limits: { instructionsMax },
        itemCount: nextPayload.items.length,
      })
      if (instructionsBlock) {
        toast.error(
          t('vault.instructions.toast.limitReached', {
            max: instructionsBlock.max,
          }),
        )
        return { success: false as const }
      }

      const ok = await persistPayload(nextPayload, isExisting ? 'updated' : 'added')
      if (ok) toast.success(input.id ? t('vault.instructions.toast.updated') : t('vault.instructions.toast.created'))
      return ok ? { success: true as const, savedInstructionId: nextItem.id } : { success: false as const }
    },
    [instructionsPayload.items, instructionsMax, persistPayload, t],
  )

  const deleteInstruction = useCallback(
    async (instructionID: string) => {
      const remaining = instructionsPayload.items.filter((item) => item.id !== instructionID)
      if (remaining.length === 0 && instructionsSection) {
        try {
          await deleteInstructionsMutation.mutateAsync()
          await instructionsQuery.refetch()
          setInstructionsPayload(emptyInstructionsPayload())
          toast.success(t('vault.instructions.toast.deleted'))
          return true
        } catch {
          toast.error(t('vault.instructions.toast.deleteFailed'))
          return false
        }
      }

      const ok = await persistPayload({ schemaVersion: 1, items: remaining }, 'updated')
      if (ok) toast.success(t('vault.instructions.toast.deleted'))
      return ok
    },
    [
      deleteInstructionsMutation,
      instructionsQuery,
      instructionsPayload.items,
      instructionsSection,
      persistPayload,
      t,
    ],
  )

  const createDocumentFolder = useCallback(
    async (name: string, parentFolderId: string | null) => {
      if (!vault || !isOwner) return null
      const normalizedName = name.trim()
      if (!normalizedName) return null
      const folderPlanBlock = checkFolderCreateAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFolderCount: documentFolders.length,
      })
      if (folderPlanBlock === 'subscription_loading') {
        toast.error(t('vault.documentsManager.planLimitsLoadingError'))
        return null
      }
      if (folderPlanBlock === 'folder_limit') {
        toast.error(t('vault.documentsManager.folderLimitReachedError', { max: documentPlanLimits.foldersMax }))
        return null
      }
      const dek = await getDek()
      if (!dek) return null
      try {
        const encrypted = await encryptDocumentName(normalizedName, dek, vault.id, vault.ownerId)
        const created = await createFolderMutation.mutateAsync({
          parentFolderId: parentFolderId ?? undefined,
          encryptedName: encrypted.encryptedName,
          nameIv: encrypted.nameIv,
        })
        return created.id
      } catch {
        toast.error(t('vault.instructions.toast.folderCreateFailed'))
        return null
      }
    },
    [
      createFolderMutation,
      documentFolders.length,
      documentPlanLimits,
      getDek,
      isOwner,
      isSubscriptionLoading,
      t,
      vault,
    ],
  )

  const uploadDocumentToFolder = useCallback(
    async (folderId: string, file: File) => {
      if (!vault || !isOwner) return null
      const mimeType = resolveAllowedDocumentMimeType(file)
      if (!mimeType) {
        toast.error(t('vault.instructions.toast.unsupportedFileType'))
        return null
      }
      const uploadPlanBlock = checkFileUploadsAgainstPlan({
        isSubscriptionLoading,
        limits: documentPlanLimits,
        currentFileCount: documentOptions.length,
        currentTotalSizeBytes: vaultDocumentStorageUsedBytes,
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
      const dek = await getDek()
      if (!dek) return null
      try {
        const encryptedName = await encryptDocumentName(file.name, dek, vault.id, vault.ownerId)
        const init = await initUploadMutation.mutateAsync({
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
        await completeUploadMutation.mutateAsync({
          fileId: init.file.id,
          data: {
            fileIv: encryptedFile.fileIv,
            encryptedSizeBytes: encryptedFile.encryptedSizeBytes,
          },
        })
        await refreshDocumentsTree()
        return { id: init.file.id, name: file.name, folderId }
      } catch {
        toast.error(t('vault.instructions.toast.documentUploadFailed'))
        return null
      }
    },
    [
      completeUploadMutation,
      documentOptions.length,
      documentPlanLimits,
      getDek,
      initUploadMutation,
      isOwner,
      isSubscriptionLoading,
      refreshDocumentsTree,
      t,
      vault,
      vaultDocumentStorageUsedBytes,
    ],
  )

  const downloadInstructionDocument = useCallback(
    async (documentID: string) => {
      if (!vault) {
        toast.error(t('vault.instructions.toast.vaultUnavailable'))
        return false
      }
      const file = documentOptions.find((doc) => doc.id === documentID)
      if (!file || !file.fileIv) {
        toast.error(t('vault.instructions.toast.documentNotReady'))
        return false
      }
      try {
        const dek = await getDek()
        if (!dek) {
          toast.error(t('vault.instructions.toast.encryptionKeysUnavailable'))
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
        link.download = file.name || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(objectURL), 500)
        return true
      } catch {
        toast.error(t('vault.instructions.toast.documentDownloadFailed'))
        return false
      }
    },
    [documentOptions, getDek, t, vault],
  )

  const { viewDocumentFile, documentViewer } = useVaultDocumentViewer<InstructionDocumentOption>({
    vault,
    getDek,
    downloadFile: (file) => downloadInstructionDocument(file.id),
    t,
  })

  return {
    vault,
    isOwner,
    isLoading: isVaultLoading || isSectionsLoading || isDocumentsLoading || contactsQuery.isLoading || isDecrypting,
    isSaving: upsertInstructionsMutation.isPending || deleteInstructionsMutation.isPending,
    instructions: instructionsPayload.items,
    instructionsMax,
    canAddMoreInstructions,
    assetOptions,
    contactOptions,
    documentOptions,
    documentFolders,
    createDocumentFolder,
    uploadDocumentToFolder,
    downloadInstructionDocument,
    viewDocumentFile,
    documentViewer,
    upsertInstruction,
    deleteInstruction,
  }
}
