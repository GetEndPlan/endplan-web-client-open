import { useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useKeyMaterial } from '@/features/keys'
import { decryptDocumentName, unwrapDekWithKeyPair } from '@/shared/lib'
import i18n from '@/shared/lib/i18n'
import type { VaultDocumentFile, VaultDocumentFolder } from '../../api/clients/vault-api'
import { useVaultDocumentsTree } from '../../api/hooks/queries/use-vault-queries'
import { vaultKeys } from '../../api/keys/vault-query-keys'

const DOCUMENTS_DECRYPT_GC_MS = 60_000
const NO_VAULT_TREE_KEY = '__no_vault__'

export type DecryptedVaultDocumentFolder = VaultDocumentFolder & {
  name: string
}

export type DecryptedVaultDocumentFile = VaultDocumentFile & {
  name: string
}

export type VaultForDocumentsTreeDecrypt = {
  id: string
  ownerId: string
  wrappedDek: string
}

function keyMaterialPart(
  publicKeyB64: string | null | undefined,
  privateKeyB64: string | null | undefined,
  pqPrivateKeyB64: string | null | undefined,
): string {
  if (!publicKeyB64 || !privateKeyB64) return 'locked'
  return `${publicKeyB64}|${privateKeyB64}|${pqPrivateKeyB64 ?? ''}`
}

function fallbackFolders(folders: VaultDocumentFolder[]): DecryptedVaultDocumentFolder[] {
  if (folders.length === 0) return []
  const label = i18n.t('vault.assets.attachments.encryptedFallbackFolderName', {
    defaultValue: 'Encrypted folder',
  })
  return folders.map((folder) => ({ ...folder, name: label }))
}

function fallbackFiles(files: VaultDocumentFile[]): DecryptedVaultDocumentFile[] {
  if (files.length === 0) return []
  const label = i18n.t('vault.assets.attachments.encryptedFallbackName', {
    defaultValue: 'Encrypted document',
  })
  return files.map((file) => ({ ...file, name: label }))
}

/**
 * Single React Query–backed decrypt of the vault documents tree so Documents, Assets, and
 * shared-vault views share one cache entry per (vault, tree revision, key material).
 */
export function useVaultDocumentsDecryptedTree(vault: VaultForDocumentsTreeDecrypt | null | undefined) {
  const queryClient = useQueryClient()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()

  const treeVaultId = vault?.id ?? NO_VAULT_TREE_KEY
  const documentsTreeQuery = useVaultDocumentsTree(vault?.id, {
    enabled: !!vault,
  })

  const keyMaterialKey = keyMaterialPart(publicKeyB64, privateKeyB64, pqPrivateKeyB64)

  const decryptedQuery = useQuery({
    queryKey: [
      ...vaultKeys.documentsTree(treeVaultId),
      'decrypted',
      documentsTreeQuery.dataUpdatedAt,
      keyMaterialKey,
      vault?.ownerId ?? '',
    ],
    enabled: Boolean(
      vault?.wrappedDek?.trim() && documentsTreeQuery.data && keyMaterialKey !== 'locked',
    ),
    gcTime: DOCUMENTS_DECRYPT_GC_MS,
    staleTime: 0,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<{
      folders: DecryptedVaultDocumentFolder[]
      files: DecryptedVaultDocumentFile[]
    }> => {
      if (!vault?.wrappedDek?.trim()) {
        return { folders: [], files: [] }
      }
      const tree = queryClient.getQueryData<{ folders?: VaultDocumentFolder[]; files?: VaultDocumentFile[] }>(
        vaultKeys.documentsTree(vault.id),
      )
      const folders = Array.isArray(tree?.folders) ? tree.folders : []
      const files = Array.isArray(tree?.files) ? tree.files : []

      if (folders.length === 0 && files.length === 0) {
        return { folders: [], files: [] }
      }

      const dek = await unwrapDekWithKeyPair(
        vault.wrappedDek,
        publicKeyB64!,
        privateKeyB64!,
        pqPrivateKeyB64,
        { vaultId: vault.id },
      )
      if (!dek) {
        return { folders: fallbackFolders(folders), files: fallbackFiles(files) }
      }
      try {
        const folderPayloads = await Promise.all(
          folders.map(async (folder) => ({
            ...folder,
            name: await decryptDocumentName(
              folder.encryptedName,
              folder.nameIv,
              dek,
              vault.id,
              vault.ownerId,
            ),
          })),
        )
        const filePayloads = await Promise.all(
          files.map(async (file) => ({
            ...file,
            name: await decryptDocumentName(
              file.encryptedName,
              file.nameIv,
              dek,
              vault.id,
              vault.ownerId,
            ),
          })),
        )
        return { folders: folderPayloads, files: filePayloads }
      } catch {
        return { folders: fallbackFolders(folders), files: fallbackFiles(files) }
      }
    },
  })

  const isDecrypting =
    Boolean(documentsTreeQuery.data && vault?.wrappedDek?.trim() && keyMaterialKey !== 'locked') &&
    (decryptedQuery.isPending || decryptedQuery.isFetching)

  const folders = useMemo(() => {
    if (!vault || keyMaterialKey === 'locked') return []
    return decryptedQuery.data?.folders ?? []
  }, [decryptedQuery.data?.folders, keyMaterialKey, vault])

  const files = useMemo(() => {
    if (!vault || keyMaterialKey === 'locked') return []
    return decryptedQuery.data?.files ?? []
  }, [decryptedQuery.data?.files, keyMaterialKey, vault])

  return {
    folders,
    files,
    documentsTreeQuery,
    isDecrypting,
  }
}
