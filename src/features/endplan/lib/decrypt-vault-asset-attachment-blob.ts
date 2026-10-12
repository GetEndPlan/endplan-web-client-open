import { decryptAssetAttachmentFile } from '@/shared/lib'
import { vaultAssetsApi } from '../api/clients/vault-api'

type VaultAssetAttachmentDecryptTarget = {
  id: string
  fileIv?: string | null
  mimeType?: string | null
  name: string
}

type VaultAssetAttachmentDecryptContext = {
  id: string
  ownerId: string
}

export async function decryptVaultAssetAttachmentToBlob(args: {
  vault: VaultAssetAttachmentDecryptContext
  file: VaultAssetAttachmentDecryptTarget
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

  const payload = await vaultAssetsApi.getAttachmentDownloadURL(vault.id, file.id)
  const encryptedRes = await fetch(payload.downloadUrl, signal ? { signal } : undefined)
  if (!encryptedRes.ok) {
    throw new Error(`Download failed (${encryptedRes.status})`)
  }

  const encryptedBytes = new Uint8Array(await encryptedRes.arrayBuffer())
  const decrypted = await decryptAssetAttachmentFile(
    encryptedBytes,
    payload.attachment.fileIv ?? file.fileIv,
    dek,
    vault.id,
    vault.ownerId,
  )

  return new Blob([new Uint8Array(decrypted)], {
    type: file.mimeType || 'application/octet-stream',
  })
}
