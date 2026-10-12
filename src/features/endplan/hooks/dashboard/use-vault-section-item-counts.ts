import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  decryptSectionContent,
  fetchBlobAsBase64,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useKeyMaterial } from '@/features/keys'
import type { VaultResponse } from '../../api/clients/vault-api'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import {
  useVaultDocumentsTree,
  useVaultSections,
} from '../../api/hooks/queries/use-vault-queries'
import { SECTION_ID } from '../../model/vault-section-types'
import {
  countSectionContentItems,
  type SectionContentPayload,
} from '../../model/section-content-counts'

const SECTION_COUNTS_GC_MS = 60_000

export type VaultSectionItemCounts = {
  assets: number
  policies: number
  documents: number
  instructions: number
  contacts: number
}

const EMPTY_COUNTS: VaultSectionItemCounts = {
  assets: 0,
  policies: 0,
  documents: 0,
  instructions: 0,
  contacts: 0,
}

export function useVaultSectionItemCounts(vault: VaultResponse | null): {
  counts: VaultSectionItemCounts
  isReady: boolean
} {
  const vaultId = vault?.id
  const queryEnabled = !!vaultId

  const { data: sections = [], isLoading: isSectionsLoading } = useVaultSections(vaultId, {
    enabled: queryEnabled,
  })
  const documentsTreeQuery = useVaultDocumentsTree(vaultId, {
    enabled: queryEnabled,
  })
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({
    enabled: queryEnabled,
  })

  const sectionsHash = useMemo(
    () => sections.map((section) => `${section.id}:${section.updatedAt}:${section.version}`).join('|'),
    [sections],
  )
  const keysReady = !!publicKeyB64 && !!privateKeyB64

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  const countsQuery = useQuery({
    queryKey: vaultKeys.sectionItemCounts(vaultId ?? '', sectionsHash),
    queryFn: async (): Promise<Omit<VaultSectionItemCounts, 'documents'>> => {
      if (!vault) {
        return { assets: 0, policies: 0, instructions: 0, contacts: 0 }
      }

      const dek = await getDek()
      if (!dek) {
        throw new Error('encryption keys unavailable')
      }

      const next = { assets: 0, policies: 0, instructions: 0, contacts: 0 }
      for (const section of sections) {
        if (
          section.sectionType !== SECTION_ID.ASSETS &&
          section.sectionType !== SECTION_ID.POLICIES &&
          section.sectionType !== SECTION_ID.INSTRUCTIONS &&
          section.sectionType !== SECTION_ID.CONTACTS
        ) {
          continue
        }

        try {
          const encryptedData = section.blobUrl
            ? await fetchBlobAsBase64(section.blobUrl)
            : (section.encryptedData ?? '')
          if (!encryptedData) continue

          const content = await decryptSectionContent<SectionContentPayload>(
            encryptedData,
            section.encryptionIv,
            dek,
            vault.id,
            vault.ownerId,
            section.sectionType,
          )
          const count = countSectionContentItems(section.sectionType, content)
          if (section.sectionType === SECTION_ID.ASSETS) next.assets = count
          if (section.sectionType === SECTION_ID.POLICIES) next.policies = count
          if (section.sectionType === SECTION_ID.INSTRUCTIONS) next.instructions = count
          if (section.sectionType === SECTION_ID.CONTACTS) next.contacts = count
        } catch {
          // Keep zero for sections that fail to decrypt.
        }
      }
      return next
    },
    enabled: queryEnabled && keysReady && !isSectionsLoading,
    staleTime: SECTION_COUNTS_GC_MS,
    gcTime: SECTION_COUNTS_GC_MS,
    retry: false,
  })

  const documentsCount = documentsTreeQuery.data?.files?.length ?? 0
  const counts: VaultSectionItemCounts = {
    assets: countsQuery.data?.assets ?? 0,
    policies: countsQuery.data?.policies ?? 0,
    documents: documentsCount,
    instructions: countsQuery.data?.instructions ?? 0,
    contacts: countsQuery.data?.contacts ?? 0,
  }

  const isReady =
    queryEnabled &&
    !isSectionsLoading &&
    (documentsTreeQuery.isSuccess || documentsTreeQuery.isError) &&
    (!keysReady || countsQuery.isSuccess || countsQuery.isError)

  if (!queryEnabled) {
    return { counts: EMPTY_COUNTS, isReady: true }
  }

  return { counts, isReady }
}
