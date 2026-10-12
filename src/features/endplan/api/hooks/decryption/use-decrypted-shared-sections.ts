import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { decryptSectionContent, fetchBlobAsBase64, unwrapDekWithKeyPair } from '@/shared/lib'
import type { VaultSectionResponse } from '../../clients/vault-api'
import { vaultKeys } from '../../keys/vault-query-keys'

type SharedAssetCategory = {
  categoryTemplateId?: string
  rows?: Array<{ id?: string; values?: Record<string, unknown> }>
}

type SharedSectionContent = {
  items?: Record<string, unknown>[]
  categories?: SharedAssetCategory[]
}

export type DecryptedSharedSection = {
  section: VaultSectionResponse
  content: SharedSectionContent | null
}

type UseDecryptedSharedSectionsParams = {
  vaultId: string | null
  ownerId: string | null
  sections: VaultSectionResponse[]
  publicKeyB64: string | null
  privateKeyB64: string | null
  pqPrivateKeyB64?: string | null
  enabled?: boolean
}

export function useDecryptedSharedSections(params: UseDecryptedSharedSectionsParams) {
  const {
    vaultId,
    ownerId,
    sections,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    enabled = true,
  } = params

  const sectionsHash = useMemo(
    () => sections.map((section) => `${section.id}:${section.updatedAt}:${section.version}`).join('|'),
    [sections],
  )

  const canDecrypt =
    enabled &&
    !!vaultId &&
    !!ownerId &&
    !!publicKeyB64 &&
    !!privateKeyB64 &&
    sections.length > 0

  const query = useQuery({
    queryKey: vaultKeys.sharedSectionsDecrypted(vaultId ?? '', ownerId ?? '', sectionsHash),
    enabled: canDecrypt,
    retry: false,
    queryFn: async (): Promise<DecryptedSharedSection[]> => {
      const decrypted: DecryptedSharedSection[] = []
      for (const section of sections) {
        if (section.sectionType === 'documents') {
          // Documents are now backed by the dedicated tree/files APIs,
          // not by the legacy encrypted section payload blob.
          decrypted.push({ section, content: { items: [] } })
          continue
        }
        if (!section.wrappedDek) {
          decrypted.push({ section, content: null })
          continue
        }
        try {
          const dek = await unwrapDekWithKeyPair(
            section.wrappedDek,
            publicKeyB64!,
            privateKeyB64!,
            pqPrivateKeyB64,
            { vaultId: vaultId! },
          )
          const encryptedData = section.blobUrl
            ? await fetchBlobAsBase64(section.blobUrl)
            : (section.encryptedData ?? '')
          const content = await decryptSectionContent<SharedSectionContent>(
            encryptedData,
            section.encryptionIv,
            dek,
            vaultId!,
            ownerId!,
            section.sectionType,
          )
          decrypted.push({ section, content: content ?? { items: [] } })
        } catch {
          decrypted.push({ section, content: null })
        }
      }
      return decrypted
    },
  })

  const rawError = canDecrypt ? query.error : null
  const error =
    rawError instanceof Error
      ? rawError.message
      : rawError
        ? 'Failed to decrypt shared sections'
        : null

  return {
    sections: canDecrypt ? (query.data ?? []) : ([] as DecryptedSharedSection[]),
    isLoading: canDecrypt && query.isLoading,
    error,
  }
}
