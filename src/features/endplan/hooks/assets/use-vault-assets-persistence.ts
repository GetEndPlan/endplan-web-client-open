import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/client'
import { encryptSectionContent } from '@/shared/lib'
import { toast } from '@/shared/ui'
import type { AssetSchemaCategory, VaultResponse, VaultSectionResponse } from '../../api/clients/vault-api'
import { hashAssetPayload } from '../../model/asset-payload-hash'
import {
  clearPendingAssetsAutosaveSnapshot,
  savePendingAssetsAutosaveSnapshot,
  type PendingAssetsAutosaveSnapshot,
} from '../../model/assets-autosave-queue'
import type { AssetSectionPayloadV2 } from '../../model/asset-table-model'
import {
  assetCategoryRowCountsFromPayload,
  checkAssetRowsAgainstPlan,
} from '../../model/plan-quota-guards'
import { SECTION_ID } from '../../model/vault-section-types'
import {
  useAssetsAutosaveController,
  type VaultAssetsPersistResult,
} from './use-assets-autosave-controller'
import type { VaultAssetsStateRefs } from './use-vault-assets-state'
import {
  buildAssetsHydrationKey,
  isLikelyOfflineError,
  withSelectedCategories,
} from './vault-assets-shared'

type SectionMutationResult = {
  id: string
  updatedAt: string
  version: number
}

type CreateSectionMutation = {
  isPending: boolean
  mutateAsync: (input: {
    sectionType: string
    sectionName: string
    encryptedData: string
    encryptionIv: string
    assetCategoryRowCounts?: Record<string, number>
  }) => Promise<SectionMutationResult>
}

type UpdateSectionMutation = {
  isPending: boolean
  mutateAsync: (input: {
    encryptedData: string
    encryptionIv: string
    expectedVersion?: number
    assetCategoryRowCounts?: Record<string, number>
  }) => Promise<SectionMutationResult>
}

type UseVaultAssetsPersistenceInput = {
  vault: VaultResponse | null
  assetsSection: VaultSectionResponse | null
  schemaCategories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  payload: AssetSectionPayloadV2
  pendingSnapshot: PendingAssetsAutosaveSnapshot | null
  isPendingSnapshotLoaded: boolean
  hasInitiallyLoaded: boolean
  canPersist: boolean
  isOffline: boolean
  setIsOffline: Dispatch<SetStateAction<boolean>>
  setPendingSnapshot: Dispatch<SetStateAction<PendingAssetsAutosaveSnapshot | null>>
  setSaveApiCallCount: Dispatch<SetStateAction<number>>
  getDek: () => Promise<Uint8Array | null>
  refetchSections: () => Promise<{ data?: VaultSectionResponse[] }>
  createSectionMutation: CreateSectionMutation
  updateSectionMutation: UpdateSectionMutation
  onAfterPersistSuccess?: (input: {
    previousPayload: AssetSectionPayloadV2 | null
    nextPayload: AssetSectionPayloadV2
  }) => Promise<void> | void
  assetRowsPerCategoryMax: number
  refs: VaultAssetsStateRefs
}

type UseVaultAssetsPersistenceOutput = {
  autosaveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  lastSavedAt: number | null
  markDirty: () => void
  clearDirty: () => void
  setEditorActive: (active: boolean) => void
  saveAssets: (payloadOverride?: AssetSectionPayloadV2) => Promise<boolean>
  markSaved: () => void
}

export function useVaultAssetsPersistence(
  input: UseVaultAssetsPersistenceInput,
): UseVaultAssetsPersistenceOutput {
  const { t } = useTranslation()
  const {
    vault,
    assetsSection,
    schemaCategories,
    selectedCategoryIds,
    payload,
    pendingSnapshot,
    isPendingSnapshotLoaded,
    hasInitiallyLoaded,
    canPersist,
    isOffline,
    setIsOffline,
    setPendingSnapshot,
    setSaveApiCallCount,
    getDek,
    refetchSections,
    createSectionMutation,
    updateSectionMutation,
    onAfterPersistSuccess,
    assetRowsPerCategoryMax,
    refs,
  } = input
  const {
    hydratedKeyRef,
    lastPersistedPayloadHashRef,
    lastPersistedPayloadRef,
    latestSectionVersionRef,
    pendingSnapshotExistsRef,
    pendingSnapshotWriteTimerRef,
    replayMarkedSnapshotKeyRef,
    restoredPendingSnapshotKeyRef,
    skipNextHydrationKeyRef,
    hasLocalUnsavedChangesRef,
    saveInFlightRef,
  } = refs
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve())

  const queuePendingSnapshot = useCallback(
    async (payloadToSave: AssetSectionPayloadV2, payloadHash: string) => {
      if (!vault) return
      const snapshot: PendingAssetsAutosaveSnapshot = {
        vaultId: vault.id,
        payload: payloadToSave,
        selectedCategoryIds,
        payloadHash,
        lastPersistedPayloadHash: lastPersistedPayloadHashRef.current,
        updatedAt: Date.now(),
      }
      try {
        await savePendingAssetsAutosaveSnapshot(snapshot)
        pendingSnapshotExistsRef.current = true
      } catch {
        // Best effort only; autosave flow still continues in-memory.
      }
    },
    [lastPersistedPayloadHashRef, pendingSnapshotExistsRef, selectedCategoryIds, vault],
  )

  const clearPendingSnapshot = useCallback(async () => {
    const vaultID = vault?.id
    if (!vaultID || !pendingSnapshotExistsRef.current) return
    try {
      await clearPendingAssetsAutosaveSnapshot(vaultID)
    } catch {
      // Best effort cleanup.
    } finally {
      pendingSnapshotExistsRef.current = false
      restoredPendingSnapshotKeyRef.current = null
      replayMarkedSnapshotKeyRef.current = null
      setPendingSnapshot((current) => (current?.vaultId === vaultID ? null : current))
    }
  }, [
    pendingSnapshotExistsRef,
    replayMarkedSnapshotKeyRef,
    restoredPendingSnapshotKeyRef,
    setPendingSnapshot,
    vault?.id,
  ])

  const persistAssets = useCallback(
    async (
      withSuccessToast: boolean,
      payloadOverride?: AssetSectionPayloadV2,
    ): Promise<VaultAssetsPersistResult> => {
      if (!vault) {
        if (withSuccessToast) {
          toast.error(t('vault.assets.attachments.vaultMissingError'))
        }
        return 'error'
      }

      if (!canPersist) {
        return 'error'
      }

      const payloadToSave =
        payloadOverride ??
        withSelectedCategories(payload, selectedCategoryIds, schemaCategories)
      const payloadHash = hashAssetPayload(payloadToSave)
      const previousPayload = lastPersistedPayloadRef.current
      if (isOffline) {
        await queuePendingSnapshot(payloadToSave, payloadHash)
        if (withSuccessToast) {
          toast.error('You are offline. Changes will sync when connection is restored.')
        }
        return 'offline'
      }
      if (lastPersistedPayloadHashRef.current === payloadHash) {
        hasLocalUnsavedChangesRef.current = false
        await clearPendingSnapshot()
        if (withSuccessToast) {
          toast.success('Assets already up to date')
        }
        return 'noop'
      }

      const assetRowsBlock = checkAssetRowsAgainstPlan({
        limits: { assetRowsPerCategoryMax },
        payload: payloadToSave,
      })
      if (assetRowsBlock) {
        return 'blocked'
      }

      const dek = await getDek()
      if (!dek) {
        if (withSuccessToast) {
          toast.error('Encryption keys not available')
        }
        return 'error'
      }

      const { encryptedData, encryptionIv } = await encryptSectionContent(
        payloadToSave,
        dek,
        vault.id,
        vault.ownerId,
        SECTION_ID.ASSETS,
      )

      try {
        saveInFlightRef.current = true
        setSaveApiCallCount((count) => count + 1)
        if (assetsSection) {
          const updateWithVersion = async (expectedVersion: number | undefined) =>
            updateSectionMutation.mutateAsync({
              encryptedData,
              encryptionIv,
              expectedVersion,
              assetCategoryRowCounts: assetCategoryRowCountsFromPayload(payloadToSave),
            })

          const initialVersion = latestSectionVersionRef.current ?? assetsSection.version

          try {
            const updated = await updateWithVersion(initialVersion)
            latestSectionVersionRef.current = updated.version
            const nextHydrationKey = buildAssetsHydrationKey(vault.id, updated)
            skipNextHydrationKeyRef.current = nextHydrationKey
            hydratedKeyRef.current = nextHydrationKey
          } catch (error) {
            const isVersionConflict =
              error instanceof ApiError &&
              error.status === 409 &&
              (error.apiMessage ?? '').toLowerCase().includes('version conflict')
            if (!isVersionConflict) {
              throw error
            }

            const refreshed = await refetchSections()
            const latestSection = (refreshed.data ?? []).find(
              (section) => section.sectionType === SECTION_ID.ASSETS,
            )
            if (!latestSection) {
              throw error
            }

            latestSectionVersionRef.current = latestSection.version
            setSaveApiCallCount((count) => count + 1)
            const updated = await updateWithVersion(latestSection.version)
            latestSectionVersionRef.current = updated.version
            const nextHydrationKey = buildAssetsHydrationKey(vault.id, updated)
            skipNextHydrationKeyRef.current = nextHydrationKey
            hydratedKeyRef.current = nextHydrationKey
          }
        } else {
          const created = await createSectionMutation.mutateAsync({
            sectionType: SECTION_ID.ASSETS,
            sectionName: 'Assets',
            encryptedData,
            encryptionIv,
            assetCategoryRowCounts: assetCategoryRowCountsFromPayload(payloadToSave),
          })
          latestSectionVersionRef.current = created.version
          const nextHydrationKey = buildAssetsHydrationKey(vault.id, created)
          skipNextHydrationKeyRef.current = nextHydrationKey
          hydratedKeyRef.current = nextHydrationKey
        }

        lastPersistedPayloadHashRef.current = payloadHash
        lastPersistedPayloadRef.current = payloadToSave
        hasLocalUnsavedChangesRef.current = false
        await clearPendingSnapshot()
        if (isOffline) {
          setIsOffline(false)
        }
        if (onAfterPersistSuccess) {
          try {
            await onAfterPersistSuccess({
              previousPayload,
              nextPayload: payloadToSave,
            })
          } catch {
            // Best effort cleanup only.
          }
        }
        if (withSuccessToast) {
          toast.success('Assets saved')
        }
        return 'saved'
      } catch (error) {
        const likelyOffline = isLikelyOfflineError(error)
        if (likelyOffline) {
          setIsOffline(true)
          await queuePendingSnapshot(payloadToSave, payloadHash)
        }
        if (withSuccessToast) {
          if (likelyOffline) {
            toast.error('You are offline. Changes are queued and will sync when online.')
          } else if (error instanceof ApiError) {
            toast.error(error.apiMessage ?? 'Failed to save assets')
          } else {
            toast.error('Failed to save assets')
          }
        }
        return likelyOffline ? 'offline' : 'error'
      } finally {
        saveInFlightRef.current = false
      }
    },
    [
      assetsSection,
      assetRowsPerCategoryMax,
      canPersist,
      clearPendingSnapshot,
      createSectionMutation,
      getDek,
      hydratedKeyRef,
      isOffline,
      lastPersistedPayloadHashRef,
      lastPersistedPayloadRef,
      latestSectionVersionRef,
      onAfterPersistSuccess,
      payload,
      queuePendingSnapshot,
      refetchSections,
      schemaCategories,
      selectedCategoryIds,
      saveInFlightRef,
      setIsOffline,
      setSaveApiCallCount,
      skipNextHydrationKeyRef,
      updateSectionMutation,
      vault,
      hasLocalUnsavedChangesRef,
      t,
    ],
  )

  const enqueuePersist = useCallback(
    async (
      withSuccessToast: boolean,
      payloadOverride?: AssetSectionPayloadV2,
    ): Promise<VaultAssetsPersistResult> => {
      let result: VaultAssetsPersistResult = 'error'
      const run = async () => {
        result = await persistAssets(withSuccessToast, payloadOverride)
      }
      const queued = persistQueueRef.current.then(run, run)
      persistQueueRef.current = queued.then(
        () => undefined,
        () => undefined,
      )
      await queued
      return result
    },
    [persistAssets],
  )

  const autosaveEnabled = hasInitiallyLoaded && canPersist && !!vault
  const {
    autosaveStatus,
    lastSavedAt,
    markDirty,
    setEditorActive,
    reset: resetAutosave,
    markSaved,
  } = useAssetsAutosaveController({
    enabled: autosaveEnabled,
    isOffline,
    persist: () => enqueuePersist(false),
  })

  useEffect(() => {
    resetAutosave()
  }, [resetAutosave, vault?.id])

  useEffect(() => {
    if (!autosaveEnabled || !isPendingSnapshotLoaded || !pendingSnapshot || pendingSnapshot.vaultId !== vault?.id) {
      return
    }
    const snapshotKey = `${pendingSnapshot.vaultId}:${pendingSnapshot.payloadHash}:${pendingSnapshot.updatedAt}`
    if (replayMarkedSnapshotKeyRef.current === snapshotKey) {
      return
    }
    replayMarkedSnapshotKeyRef.current = snapshotKey
    markDirty()
  }, [
    autosaveEnabled,
    isPendingSnapshotLoaded,
    markDirty,
    pendingSnapshot,
    replayMarkedSnapshotKeyRef,
    vault?.id,
  ])

  useEffect(() => {
    const vaultID = vault?.id
    if (!autosaveEnabled || !vaultID) {
      return
    }

    const payloadToQueue = withSelectedCategories(payload, selectedCategoryIds, schemaCategories)
    const payloadHash = hashAssetPayload(payloadToQueue)
    const lastPersistedHash = lastPersistedPayloadHashRef.current

    if (payloadHash === lastPersistedHash) {
      if (pendingSnapshotWriteTimerRef.current) {
        clearTimeout(pendingSnapshotWriteTimerRef.current)
        pendingSnapshotWriteTimerRef.current = null
      }
      void clearPendingSnapshot()
      return
    }

    if (pendingSnapshotWriteTimerRef.current) {
      clearTimeout(pendingSnapshotWriteTimerRef.current)
      pendingSnapshotWriteTimerRef.current = null
    }
    pendingSnapshotWriteTimerRef.current = setTimeout(() => {
      void queuePendingSnapshot(payloadToQueue, payloadHash)
    }, 350)

    return () => {
      if (pendingSnapshotWriteTimerRef.current) {
        clearTimeout(pendingSnapshotWriteTimerRef.current)
        pendingSnapshotWriteTimerRef.current = null
      }
    }
  }, [
    autosaveEnabled,
    clearPendingSnapshot,
    lastPersistedPayloadHashRef,
    pendingSnapshotWriteTimerRef,
    payload,
    queuePendingSnapshot,
    schemaCategories,
    selectedCategoryIds,
    vault?.id,
  ])

  const saveAssets = useCallback(async (payloadOverride?: AssetSectionPayloadV2) => {
    const result = await enqueuePersist(false, payloadOverride)
    const ok = result === 'saved' || result === 'noop'
    if (ok) markSaved()
    return ok
  }, [enqueuePersist, markSaved])

  const markDirtyWithTracking = useCallback(() => {
    hasLocalUnsavedChangesRef.current = true
    markDirty()
  }, [hasLocalUnsavedChangesRef, markDirty])

  const clearDirty = useCallback(() => {
    hasLocalUnsavedChangesRef.current = false
  }, [hasLocalUnsavedChangesRef])

  return {
    autosaveStatus,
    lastSavedAt,
    markDirty: markDirtyWithTracking,
    clearDirty,
    setEditorActive,
    saveAssets,
    markSaved,
  }
}
