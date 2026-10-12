import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useKeyMaterial } from '@/features/keys'
import { decryptSectionContent, fetchBlobAsBase64, unwrapDekWithKeyPair } from '@/shared/lib'
import { areApiRequestsBlocked } from '@/shared/api'
import { ensureOwnedVaultIfMissing } from '../../services/ensure-owned-vault-if-missing'
import { isEndPlanEmpty, type EndPlanData } from '../../services/endplan-service'
import type { VaultSectionResponse } from '../../clients/vault-api'
import { useDecryptedVaultData } from '../decryption/use-decrypted-vault-data'
import { vaultApi, vaultAssetsApi, vaultPoliciesApi, vaultContactsApi, vaultDocumentsApi, vaultInstructionsApi, vaultSectionApi } from '../../clients/vault-api'
import { vaultKeys } from '../../keys/vault-query-keys'
import { SECTION_ID, isVisibleVaultSectionType } from '../../../model/vault-section-types'
import {
  countSectionContentItems,
  type SectionContentPayload,
} from '../../../model/section-content-counts'

/** Garbage-collect large vault payloads sooner after the last subscriber unmounts. */
const HEAVY_VAULT_QUERY_GC_MS = 60_000

export function useVaultsOwned(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.owned(),
    queryFn: () => vaultApi.listOwned(),
    select: (data) => data.vaults,
    enabled: options?.enabled ?? true,
  })
}

export function useVaultsShared(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.shared(),
    queryFn: () => vaultApi.listShared(),
    select: (data) => data.vaults,
    enabled: options?.enabled ?? true,
  })
}

type UseDecryptedUserVaultResult = {
  vault: ReturnType<typeof useUserVault>['data']
  data: EndPlanData | null
  hasContent: boolean
  isCreated: boolean
  isLoading: boolean
  isDecrypting: boolean
  isResolved: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useDecryptedUserVault(options?: {
  enabled?: boolean
  /** Pass the signed-in user id so an empty owned-vault list can bootstrap before first paint. */
  ownerUserId?: string | null
}): UseDecryptedUserVaultResult {
  const userVault = useUserVault(options)
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: options?.enabled ?? true })

  const vault = userVault.data
  const decryptedQuery = useDecryptedVaultData({
    vault,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    queryKey: vaultKeys.decrypted(vault?.id ?? '', vault?.updatedAt ?? ''),
    enabled: options?.enabled ?? true,
  })
  const { canDecrypt } = decryptedQuery

  const data = decryptedQuery.data ?? null
  const hasContent = !isEndPlanEmpty(data)
  const isCreated = hasContent
  const isDecrypting = canDecrypt && decryptedQuery.isLoading
  const isLoading = userVault.isLoading || isDecrypting
  const isResolved =
    userVault.isResolved &&
    (!canDecrypt || decryptedQuery.isSuccess || decryptedQuery.isError)

  const rawError = userVault.error ?? decryptedQuery.error ?? null
  const error = rawError instanceof Error ? rawError : null
  const isError = !!rawError

  return {
    vault,
    data,
    hasContent,
    isCreated,
    isLoading,
    isDecrypting,
    isResolved,
    isError,
    error,
    refetch: async () => {
      await userVault.refetch()
      if (canDecrypt) {
        await decryptedQuery.refetch()
      }
    },
  }
}

type UseUserVaultSectionContentResult = {
  vault: ReturnType<typeof useUserVault>['data']
  hasVault: boolean
  /**
   * True if the user has meaningful plan content: non-empty primary vault body, at least one
   * filled asset row (empty category placeholder rows do not count), at least one item in
   * another decrypted section payload, or at least one vault document folder or file.
   */
  hasVaultSectionContent: boolean
  isLoading: boolean
  isResolved: boolean
}

async function ownerVaultHasNonEmptySectionPayload(
  vault: NonNullable<ReturnType<typeof useUserVault>['data']>,
  sections: VaultSectionResponse[],
  publicKeyB64: string,
  privateKeyB64: string,
  pqPrivateKeyB64: string | null | undefined,
): Promise<boolean> {
  const dek = await unwrapDekWithKeyPair(
    vault.wrappedDek,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    { vaultId: vault.id },
  )
  for (const section of sections) {
    if (section.sectionType === SECTION_ID.DOCUMENTS) continue
    if (!isVisibleVaultSectionType(section.sectionType)) continue
    try {
      const encryptedData = section.blobUrl
        ? await fetchBlobAsBase64(section.blobUrl)
        : (section.encryptedData ?? '')
      const content = await decryptSectionContent<SectionContentPayload>(
        encryptedData,
        section.encryptionIv,
        dek,
        vault.id,
        vault.ownerId,
        section.sectionType,
      )
      if (countSectionContentItems(section.sectionType, content) > 0) return true
    } catch {
      continue
    }
  }
  return false
}

export function useUserVaultSectionContent(
  options?: { enabled?: boolean; ownerUserId?: string | null },
): UseUserVaultSectionContentResult {
  const enabled = options?.enabled ?? true
  const decryptedVault = useDecryptedUserVault(options)
  const vault = decryptedVault.vault
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled })

  const sectionsQuery = useVaultSections(vault?.id, {
    enabled: !!vault && enabled,
  })

  const documentsTreeQuery = useVaultDocumentsTree(vault?.id, {
    enabled: !!vault && enabled,
  })

  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data])
  const sectionsHash = useMemo(
    () => sections.map((s) => `${s.id}:${s.updatedAt}:${s.version}`).join('|'),
    [sections],
  )

  const hasNonDocumentSections = sections.some((s) => s.sectionType !== SECTION_ID.DOCUMENTS)
  const keysReady = !!publicKeyB64 && !!privateKeyB64
  const awaitingKeysForSectionDecrypt =
    enabled && !!vault && sectionsQuery.isSuccess && hasNonDocumentSections && !keysReady

  const canDecryptSectionPayloads =
    enabled && !!vault && keysReady && sectionsQuery.isSuccess && sections.length > 0

  const sectionPayloadSignalQuery = useQuery({
    queryKey: vaultKeys.ownerSectionsContentSignal(vault?.id ?? '', sectionsHash),
    enabled: canDecryptSectionPayloads,
    staleTime: 30_000,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
    queryFn: () =>
      ownerVaultHasNonEmptySectionPayload(vault!, sections, publicKeyB64!, privateKeyB64!, pqPrivateKeyB64),
  })

  const hasDocumentsTreeContent =
    (documentsTreeQuery.data?.files?.length ?? 0) > 0 ||
    (documentsTreeQuery.data?.folders?.length ?? 0) > 0
  const hasNonEmptySectionPayloads = sectionPayloadSignalQuery.data === true
  const hasVaultSectionContent =
    decryptedVault.hasContent || hasNonEmptySectionPayloads || hasDocumentsTreeContent

  const isLoading =
    decryptedVault.isLoading ||
    (!!vault && sectionsQuery.isLoading) ||
    (!!vault && documentsTreeQuery.isLoading) ||
    awaitingKeysForSectionDecrypt ||
    (canDecryptSectionPayloads && sectionPayloadSignalQuery.isLoading)

  const isResolved =
    !awaitingKeysForSectionDecrypt &&
    decryptedVault.isResolved &&
    (!vault || sectionsQuery.isSuccess || sectionsQuery.isError) &&
    (!vault || documentsTreeQuery.isSuccess || documentsTreeQuery.isError) &&
    (!vault ||
      !canDecryptSectionPayloads ||
      sectionPayloadSignalQuery.isSuccess ||
      sectionPayloadSignalQuery.isError)

  return {
    vault,
    hasVault: vault != null,
    hasVaultSectionContent,
    isLoading,
    isResolved,
  }
}

export function useVault(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.byId(vaultId ?? ''),
    queryFn: () => vaultApi.getById(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
  })
}

export type UseUserVaultOptions = {
  enabled?: boolean
  /**
   * When the owned-vault list is empty and keys are unlocked, creates an initial vault
   * (same as signup) and keeps `isLoading` true until the list refetches — avoids flashing
   * the “create EndPlan from dashboard” empty state on vault routes.
   */
  ownerUserId?: string | null
}

/**
 * Returns the current user's single vault (first from list + full fetch).
 * Use in layout/dashboard to drive "has vault" and vault detail.
 */
export function useUserVault(options?: UseUserVaultOptions) {
  const queryClient = useQueryClient()
  const enabled = options?.enabled ?? true
  const ownerUserId = options?.ownerUserId ?? undefined
  const { publicKeyB64, privateKeyB64, pqPublicKeyB64 } = useKeyMaterial({ enabled })

  const list = useQuery({
    queryKey: vaultKeys.owned(),
    queryFn: () => vaultApi.listOwned(),
    enabled,
  })

  const firstId = list.data?.vaults?.[0]?.id
  const vaultQuery = useQuery({
    queryKey: vaultKeys.byId(firstId ?? ''),
    queryFn: () => vaultApi.getById(firstId!),
    enabled: !!firstId && enabled,
  })

  const isEmptyOwnedList =
    list.isSuccess && (list.data?.vaults?.length ?? 0) === 0 && !list.isError

  const [vaultBootstrapDone, setVaultBootstrapDone] = useState(false)

  useEffect(() => {
    if (!isEmptyOwnedList) {
      setVaultBootstrapDone(false)
      return
    }
    if (areApiRequestsBlocked()) {
      setVaultBootstrapDone(true)
      return
    }
    if (!ownerUserId || !publicKeyB64 || !privateKeyB64 || vaultBootstrapDone) {
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const createdVault = await ensureOwnedVaultIfMissing({
          ownerId: ownerUserId,
          publicKeyB64,
          pqPublicKeyB64,
        })
        if (cancelled) return
        if (createdVault) {
          await queryClient.invalidateQueries({ queryKey: vaultKeys.all })
        }
        await queryClient.fetchQuery({
          queryKey: vaultKeys.owned(),
          queryFn: () => vaultApi.listOwned(),
        })
      } catch {
        // Non-fatal; user may retry by navigation / refresh
      } finally {
        if (!cancelled) {
          setVaultBootstrapDone(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    isEmptyOwnedList,
    ownerUserId,
    publicKeyB64,
    privateKeyB64,
    pqPublicKeyB64,
    vaultBootstrapDone,
    queryClient,
  ])

  const isBootstrappingVault =
    isEmptyOwnedList &&
    !!ownerUserId &&
    !!publicKeyB64 &&
    !!privateKeyB64 &&
    !vaultBootstrapDone

  const isResolved =
    list.isError ||
    (!isBootstrappingVault &&
      list.isSuccess &&
      (!firstId || vaultQuery.isSuccess || vaultQuery.isError))

  return {
    ...vaultQuery,
    data: vaultQuery.data ?? null,
    isLoading: list.isLoading || (!!firstId && vaultQuery.isLoading) || isBootstrappingVault,
    isError: list.isError || vaultQuery.isError,
    isResolved,
    error: list.error ?? vaultQuery.error,
    refetch: async () => {
      await list.refetch()
      if (firstId) await vaultQuery.refetch()
    },
  }
}

export function useVaultSections(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.sections(vaultId ?? ''),
    queryFn: () => vaultSectionApi.list(vaultId!),
    select: (data) => data.sections,
    enabled: !!vaultId && (options?.enabled ?? true),
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultSection(
  vaultId: string | undefined,
  sectionId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vaultKeys.sectionById(vaultId ?? '', sectionId ?? ''),
    queryFn: () => vaultSectionApi.getById(vaultId!, sectionId!),
    enabled: !!vaultId && !!sectionId && (options?.enabled ?? true),
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultInstructions(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.instructions(vaultId ?? ''),
    queryFn: () => vaultInstructionsApi.get(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    retry: false,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultContacts(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.contacts(vaultId ?? ''),
    queryFn: () => vaultContactsApi.get(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    retry: false,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultAssetsSchema(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.assetsSchema(vaultId ?? ''),
    queryFn: () => vaultAssetsApi.getSchema(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes - prevent unnecessary refetches
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultAssetAttachments(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.assetsAttachments(vaultId ?? ''),
    queryFn: () => vaultAssetsApi.listAttachments(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    staleTime: 1000 * 30,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultPoliciesSchema(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.policiesSchema(vaultId ?? ''),
    queryFn: () => vaultPoliciesApi.getSchema(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultPolicyAttachments(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.policiesAttachments(vaultId ?? ''),
    queryFn: () => vaultPoliciesApi.listAttachments(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    staleTime: 1000 * 30,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}

export function useVaultDocumentsTree(vaultId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vaultKeys.documentsTree(vaultId ?? ''),
    queryFn: () => vaultDocumentsApi.getTree(vaultId!),
    enabled: !!vaultId && (options?.enabled ?? true),
    staleTime: 1000 * 30,
    gcTime: HEAVY_VAULT_QUERY_GC_MS,
  })
}
