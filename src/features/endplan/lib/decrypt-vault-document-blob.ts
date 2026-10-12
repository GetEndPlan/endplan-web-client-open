import { decryptDocumentFile } from '@/shared/lib'
import { vaultDocumentsApi } from '../api/clients/vault-api'

type VaultDocumentDecryptTarget = {
  id: string
  fileIv?: string | null
  mimeType?: string | null
  name: string
}

type VaultDocumentDecryptContext = {
  id: string
  ownerId: string
}

export async function decryptVaultDocumentToBlob(args: {
  vault: VaultDocumentDecryptContext
  file: VaultDocumentDecryptTarget
  getDek: () => Promise<Uint8Array | null>
  signal?: AbortSignal
}): Promise<Blob> {
  const { vault, file, getDek, signal } = args

  if (!file.fileIv) {
    throw new Error('File is not ready to view')
  }

  const dek = await getDek()
  if (!dek) {
    throw new Error('Encryption keys not available')
  }

  const payload = await vaultDocumentsApi.getDownloadURL(vault.id, file.id)
  const encryptedRes = await fetch(payload.downloadUrl, signal ? { signal } : undefined)
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

  return new Blob([normalizedDecrypted], {
    type: file.mimeType || 'application/octet-stream',
  })
}
