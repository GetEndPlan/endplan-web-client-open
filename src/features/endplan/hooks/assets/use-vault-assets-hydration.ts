import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  decryptSectionContent,
  fetchBlobAsBase64,
} from '@/shared/lib'
import type { AssetSchemaCategory, VaultResponse, VaultSectionResponse } from '../../api/clients/vault-api'
import { hashAssetPayload } from '../../model/asset-payload-hash'
import {
  clearPendingAssetsAutosaveSnapshot,
  type PendingAssetsAutosaveSnapshot,
} from '../../model/assets-autosave-queue'
import { normalizeAssetPayload, type AssetSectionPayloadV2 } from '../../model/asset-table-model'
import { SECTION_ID } from '../../model/vault-section-types'
import type { VaultAssetsStateRefs } from './use-vault-assets-state'
import {
  buildAssetsHydrationKey,
  emptyAssetsPayload,
  resolveAssetsHydrationSelectedCategoryIds,
  shouldApplyPendingAssetsSnapshot,
  shouldApplyServerHydratedAssetsPayload,
  withSelectedCategories,
} from './vault-assets-shared'

export type VaultAssetsHydrationStatus = 'idle' | 'loading' | 'ready' | 'error'

type UseVaultAssetsHydrationInput = {
  vault: VaultResponse | null
  assetsSection: VaultSectionResponse | null
  schemaCategories: AssetSchemaCategory[]
  schemaSelectedCategoryIds: string[]
  isSchemaLoaded: boolean
  pendingSnapshot: PendingAssetsAutosaveSnapshot | null
  isPendingSnapshotLoaded: boolean
  publicKeyB64: string | null
  privateKeyB64: string | null
  getDek: () => Promise<Uint8Array | null>
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>
  setPayload: Dispatch<SetStateAction<AssetSectionPayloadV2>>
  setIsDecrypting: Dispatch<SetStateAction<boolean>>
  setHasInitiallyLoaded: Dispatch<SetStateAction<boolean>>
  setPendingSnapshot: Dispatch<SetStateAction<PendingAssetsAutosaveSnapshot | null>>
  refs: VaultAssetsStateRefs
}

type UseVaultAssetsHydrationOutput = {
  hydrationStatus: VaultAssetsHydrationStatus
  hydrationErrorKey: string | null
  canPersist: boolean
  retryHydration: () => void
}

function applyHydratedPayload(args: {
  payload: AssetSectionPayloadV2
  selectedCategoryIds: string[]
  hydrationKey: string
  refs: Pick<
    VaultAssetsStateRefs,
    | 'hydratedKeyRef'
    | 'hydratingKeyRef'
    | 'lastPersistedPayloadHashRef'
    | 'lastPersistedPayloadRef'
  >
  setSelectedCategoryIds: Dispatch<SetStateAction<string[]>>
  setPayload: Dispatch<SetStateAction<AssetSectionPayloadV2>>
  mergeSelectedCategoryIds?: boolean
}) {
  const {
    payload,
    selectedCategoryIds,
    hydrationKey,
    refs,
    setSelectedCategoryIds,
    setPayload,
    mergeSelectedCategoryIds = true,
  } = args
  if (mergeSelectedCategoryIds) {
    setSelectedCategoryIds((current) => (current.length > 0 ? current : selectedCategoryIds))
  } else {
    setSelectedCategoryIds(selectedCategoryIds)
  }
  setPayload(payload)
  refs.lastPersistedPayloadHashRef.current = hashAssetPayload(payload)
  refs.lastPersistedPayloadRef.current = payload
  refs.hydratedKeyRef.current = hydrationKey
  refs.hydratingKeyRef.current = null
}

export function useVaultAssetsHydration(
  input: UseVaultAssetsHydrationInput,
): UseVaultAssetsHydrationOutput {
  const {
    vault,
    assetsSection,
    schemaCategories,
    schemaSelectedCategoryIds,
    isSchemaLoaded,
    pendingSnapshot,
    isPendingSnapshotLoaded,
    publicKeyB64,
    privateKeyB64,
    getDek,
    setSelectedCategoryIds,
    setPayload,
    setIsDecrypting,
    setHasInitiallyLoaded,
    setPendingSnapshot,
    refs,
  } = input
  const {
    hydratedKeyRef,
    hydratingKeyRef,
    skipNextHydrationKeyRef,
    lastPersistedPayloadHashRef,
    lastPersistedPayloadRef,
    restoredPendingSnapshotKeyRef,
    latestSectionVersionRef,
    hasLocalUnsavedChangesRef,
    saveInFlightRef,
    pendingSnapshotExistsRef,
    replayMarkedSnapshotKeyRef,
  } = refs

  const [hydrationStatus, setHydrationStatus] = useState<VaultAssetsHydrationStatus>('idle')
  const [hydrationErrorKey, setHydrationErrorKey] = useState<string | null>(null)
  const [canPersist, setCanPersist] = useState(false)
  const [hydrationRetryCount, setHydrationRetryCount] = useState(0)

  const hydrationKey = useMemo(() => {
    if (!vault) return null
    return buildAssetsHydrationKey(vault.id, assetsSection)
  }, [assetsSection, vault])

  const retryHydration = useCallback(() => {
    hydratedKeyRef.current = null
    hydratingKeyRef.current = null
    setHydrationErrorKey(null)
    setCanPersist(false)
    setHasInitiallyLoaded(false)
    setHydrationStatus('idle')
    setHydrationRetryCount((count) => count + 1)
  }, [hydratedKeyRef, hydratingKeyRef, setHasInitiallyLoaded])

  useEffect(() => {
    latestSectionVersionRef.current = assetsSection?.version ?? null
  }, [assetsSection?.id, assetsSection?.version, latestSectionVersionRef])

  useEffect(() => {
    if (!vault) {
      hydratingKeyRef.current = null
      setIsDecrypting(false)
      setHydrationStatus('idle')
      setHydrationErrorKey(null)
      setCanPersist(false)
      return
    }
    if (!hydrationKey || !isPendingSnapshotLoaded || !isSchemaLoaded) {
      return
    }
    if (hydratedKeyRef.current === hydrationKey) {
      return
    }
    if (hydratingKeyRef.current === hydrationKey) {
      return
    }
    hydratingKeyRef.current = hydrationKey

    const finishReady = (
      payload: AssetSectionPayloadV2,
      selectedIds: string[],
      options?: { mergeSelectedCategoryIds?: boolean },
    ) => {
      applyHydratedPayload({
        payload,
        selectedCategoryIds: selectedIds,
        hydrationKey,
        refs: {
          hydratedKeyRef,
          hydratingKeyRef,
          lastPersistedPayloadHashRef,
          lastPersistedPayloadRef,
        },
        setSelectedCategoryIds,
        setPayload,
        mergeSelectedCategoryIds: options?.mergeSelectedCategoryIds,
      })
      setIsDecrypting(false)
      setHasInitiallyLoaded(true)
      setHydrationStatus('ready')
      setHydrationErrorKey(null)
      setCanPersist(true)
    }

    const finishReadyWithoutPayloadReplace = () => {
      hydratedKeyRef.current = hydrationKey
      hydratingKeyRef.current = null
      setIsDecrypting(false)
      setHasInitiallyLoaded(true)
      setHydrationStatus('ready')
      setHydrationErrorKey(null)
      setCanPersist(true)
    }

    const finishError = () => {
      hydratingKeyRef.current = null
      setIsDecrypting(false)
      setHasInitiallyLoaded(false)
      setHydrationStatus('error')
      setHydrationErrorKey('vault.assets.hydration.loadFailed')
      setCanPersist(false)
    }

    const clearRejectedPendingSnapshot = async () => {
      try {
        await clearPendingAssetsAutosaveSnapshot(vault.id)
      } catch {
        // Best effort.
      }
      pendingSnapshotExistsRef.current = false
      restoredPendingSnapshotKeyRef.current = null
      replayMarkedSnapshotKeyRef.current = null
      setPendingSnapshot((current) => (current?.vaultId === vault.id ? null : current))
    }

    if (skipNextHydrationKeyRef.current === hydrationKey) {
      hydratedKeyRef.current = hydrationKey
      hydratingKeyRef.current = null
      skipNextHydrationKeyRef.current = null
      setIsDecrypting(false)
      setHasInitiallyLoaded(true)
      setHydrationStatus('ready')
      setHydrationErrorKey(null)
      setCanPersist(true)
      return
    }

    if (hasLocalUnsavedChangesRef.current || saveInFlightRef.current) {
      skipNextHydrationKeyRef.current = hydrationKey
      hydratingKeyRef.current = null
      setIsDecrypting(false)
      setHasInitiallyLoaded(true)
      setHydrationStatus('ready')
      setHydrationErrorKey(null)
      setCanPersist(true)
      return
    }

    if (!publicKeyB64 || !privateKeyB64) {
      hydratingKeyRef.current = null
      setHydrationStatus('idle')
      return
    }

    if (!assetsSection) {
      if (pendingSnapshot?.vaultId === vault.id) {
        const normalizedPending = withSelectedCategories(
          normalizeAssetPayload(pendingSnapshot.payload, schemaCategories),
          pendingSnapshot.selectedCategoryIds,
          schemaCategories,
        )
        finishReady(normalizedPending, pendingSnapshot.selectedCategoryIds, {
          mergeSelectedCategoryIds: false,
        })
        restoredPendingSnapshotKeyRef.current = `${pendingSnapshot.vaultId}:${pendingSnapshot.payloadHash}:${pendingSnapshot.updatedAt}`
        return
      }

      const hydratedPayload = withSelectedCategories(
        emptyAssetsPayload(),
        schemaSelectedCategoryIds,
        schemaCategories,
      )
      finishReady(
        hydratedPayload,
        schemaSelectedCategoryIds.length > 0 ? schemaSelectedCategoryIds : [],
      )
      return
    }

    let cancelled = false
    setHydrationStatus('loading')
    setHydrationErrorKey(null)
    setCanPersist(false)
    setIsDecrypting(true)

    void (async () => {
      try {
        const dek = await getDek()
        if (cancelled) return
        if (!dek) {
          hydratingKeyRef.current = null
          setIsDecrypting(false)
          setHydrationStatus('idle')
          return
        }

        const encryptedData = assetsSection.blobUrl
          ? await fetchBlobAsBase64(assetsSection.blobUrl)
          : (assetsSection.encryptedData ?? '')

        if (!encryptedData) {
          throw new Error('assets section ciphertext missing')
        }

        const decoded = await decryptSectionContent<unknown>(
          encryptedData,
          assetsSection.encryptionIv,
          dek,
          vault.id,
          vault.ownerId,
          SECTION_ID.ASSETS,
        )
        if (cancelled) return

        const normalized = normalizeAssetPayload(decoded, schemaCategories)
        const inferredSelected = resolveAssetsHydrationSelectedCategoryIds({
          schemaSelectedCategoryIds,
          payloadCategoryIds: normalized.categories.map((category) => category.categoryTemplateId),
          isSchemaLoaded,
        })
        const serverPayload = withSelectedCategories(normalized, inferredSelected, schemaCategories)
        const serverPayloadHash = hashAssetPayload(serverPayload)

        if (
          pendingSnapshot?.vaultId === vault.id &&
          shouldApplyPendingAssetsSnapshot({
            pending: pendingSnapshot,
            serverPayload,
            serverPayloadHash,
            schemaCategories,
          })
        ) {
          const normalizedPending = withSelectedCategories(
            normalizeAssetPayload(pendingSnapshot.payload, schemaCategories),
            pendingSnapshot.selectedCategoryIds,
            schemaCategories,
          )
          finishReady(normalizedPending, pendingSnapshot.selectedCategoryIds, {
            mergeSelectedCategoryIds: false,
          })
          restoredPendingSnapshotKeyRef.current = `${pendingSnapshot.vaultId}:${pendingSnapshot.payloadHash}:${pendingSnapshot.updatedAt}`
          return
        }

        if (pendingSnapshot?.vaultId === vault.id) {
          await clearRejectedPendingSnapshot()
        }

        if (
          !shouldApplyServerHydratedAssetsPayload({
            serverPayload,
            serverPayloadHash,
            lastPersistedPayload: lastPersistedPayloadRef.current,
            lastPersistedPayloadHash: lastPersistedPayloadHashRef.current,
          })
        ) {
          finishReadyWithoutPayloadReplace()
          return
        }

        finishReady(serverPayload, inferredSelected, { mergeSelectedCategoryIds: false })
      } catch {
        if (cancelled) return
        finishError()
      }
    })()

    return () => {
      cancelled = true
      if (hydratingKeyRef.current === hydrationKey) {
        hydratingKeyRef.current = null
      }
    }
  }, [
    assetsSection,
    getDek,
    hydrationKey,
    hydrationRetryCount,
    isPendingSnapshotLoaded,
    isSchemaLoaded,
    hydratedKeyRef,
    hydratingKeyRef,
    lastPersistedPayloadHashRef,
    lastPersistedPayloadRef,
    latestSectionVersionRef,
    pendingSnapshot,
    pendingSnapshotExistsRef,
    privateKeyB64,
    publicKeyB64,
    replayMarkedSnapshotKeyRef,
    restoredPendingSnapshotKeyRef,
    hasLocalUnsavedChangesRef,
    saveInFlightRef,
    schemaCategories,
    schemaSelectedCategoryIds,
    setHasInitiallyLoaded,
    setIsDecrypting,
    setPayload,
    setPendingSnapshot,
    setSelectedCategoryIds,
    skipNextHydrationKeyRef,
    vault,
  ])

  return {
    hydrationStatus,
    hydrationErrorKey,
    canPersist,
    retryHydration,
  }
}
