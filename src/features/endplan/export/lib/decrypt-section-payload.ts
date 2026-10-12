import { decryptSectionContent, fetchBlobAsBase64 } from '@/shared/lib'
import type { VaultSectionResponse } from '../../api/clients/vault-api'

export async function decryptVaultSectionJson<T>(args: {
  section: Pick<VaultSectionResponse, 'encryptedData' | 'encryptionIv' | 'blobUrl'>
  dek: Uint8Array
  vaultId: string
  ownerId: string
  sectionType: string
}): Promise<T> {
  const encryptedData = args.section.blobUrl
    ? await fetchBlobAsBase64(args.section.blobUrl)
    : (args.section.encryptedData ?? '')
  return decryptSectionContent<T>(
    encryptedData,
    args.section.encryptionIv,
    args.dek,
    args.vaultId,
    args.ownerId,
    args.sectionType,
  )
}
