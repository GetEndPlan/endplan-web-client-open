import {
  cryptoEncoding,
  decryptAesGcmV1,
  encryptAesGcmV1,
  hkdfSha256,
  type CryptoEnvelopeV1,
} from './core'

const { toBase64, fromBase64 } = cryptoEncoding

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const buildVaultAAD = (vaultId: string, ownerId: string): string => {
  return `vault:${vaultId}|owner:${ownerId}|type:will|v:1`
}

const buildSectionAAD = (vaultId: string, ownerId: string, sectionType: string): string => {
  return `section:${sectionType}|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildDocumentNameAAD = (vaultId: string, ownerId: string): string => {
  return `documents:name|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildDocumentFileAAD = (vaultId: string, ownerId: string): string => {
  return `documents:file|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildAssetAttachmentNameAAD = (vaultId: string, ownerId: string): string => {
  return `assets:attachment:name|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildAssetAttachmentFileAAD = (vaultId: string, ownerId: string): string => {
  return `assets:attachment:file|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildPolicyAttachmentNameAAD = (vaultId: string, ownerId: string): string => {
  return `policies:attachment:name|vault:${vaultId}|owner:${ownerId}|v:1`
}

const buildPolicyAttachmentFileAAD = (vaultId: string, ownerId: string): string => {
  return `policies:attachment:file|vault:${vaultId}|owner:${ownerId}|v:1`
}

type BinaryInput = Uint8Array | ArrayBuffer | Blob

const toBytes = async (input: BinaryInput): Promise<Uint8Array> => {
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  const buffer = await input.arrayBuffer()
  return new Uint8Array(buffer)
}

export const encryptVaultJson = async (
  data: unknown,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<CryptoEnvelopeV1> => {
  const plaintext = encoder.encode(
    typeof data === 'string' ? data : JSON.stringify(data),
  )
  const vaultKey = await hkdfSha256(dek, 'vault-encryption')
  const aad = buildVaultAAD(vaultId, ownerId)
  return encryptAesGcmV1(plaintext, vaultKey, aad)
}

export const decryptVaultJson = async <T = unknown>(
  payload: CryptoEnvelopeV1,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<T> => {
  const vaultKey = await hkdfSha256(dek, 'vault-encryption')
  const aad = buildVaultAAD(vaultId, ownerId)
  const plaintext = await decryptAesGcmV1(payload, vaultKey, aad)
  return JSON.parse(decoder.decode(plaintext)) as T
}

export const encryptSectionContent = async (
  data: unknown,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
  sectionType: string,
): Promise<{ encryptedData: string; encryptionIv: string }> => {
  const plaintext = encoder.encode(
    typeof data === 'string' ? data : JSON.stringify(data),
  )
  const sectionKey = await hkdfSha256(dek, 'section-encryption')
  const aad = buildSectionAAD(vaultId, ownerId, sectionType)
  const envelope = await encryptAesGcmV1(plaintext, sectionKey, aad)
  return { encryptedData: envelope.ciphertextB64, encryptionIv: envelope.ivB64 }
}

export const decryptSectionContent = async <T = unknown>(
  encryptedData: string,
  encryptionIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
  sectionType: string,
): Promise<T> => {
  const payload: CryptoEnvelopeV1 = {
    v: 1,
    alg: 'AES-256-GCM',
    ciphertextB64: encryptedData,
    ivB64: encryptionIv,
  }
  const sectionKey = await hkdfSha256(dek, 'section-encryption')
  const aad = buildSectionAAD(vaultId, ownerId, sectionType)
  const plaintext = await decryptAesGcmV1(payload, sectionKey, aad)
  return JSON.parse(decoder.decode(plaintext)) as T
}

export const encryptDocumentName = async (
  name: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedName: string; nameIv: string }> => {
  const documentNameKey = await hkdfSha256(dek, 'document-name-encryption')
  const aad = buildDocumentNameAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(encoder.encode(name), documentNameKey, aad)
  return {
    encryptedName: payload.ciphertextB64,
    nameIv: payload.ivB64,
  }
}

export const decryptDocumentName = async (
  encryptedName: string,
  nameIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<string> => {
  const documentNameKey = await hkdfSha256(dek, 'document-name-encryption')
  const aad = buildDocumentNameAAD(vaultId, ownerId)
  const plaintext = await decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: encryptedName,
      ivB64: nameIv,
    },
    documentNameKey,
    aad,
  )
  return decoder.decode(plaintext)
}

export const encryptDocumentFile = async (
  fileInput: BinaryInput,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedBytes: Uint8Array; fileIv: string; encryptedSizeBytes: number }> => {
  const fileBytes = await toBytes(fileInput)
  const documentFileKey = await hkdfSha256(dek, 'document-file-encryption')
  const aad = buildDocumentFileAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(fileBytes, documentFileKey, aad)
  const encryptedBytes = fromBase64(payload.ciphertextB64)
  return {
    encryptedBytes,
    fileIv: payload.ivB64,
    encryptedSizeBytes: encryptedBytes.byteLength,
  }
}

export const decryptDocumentFile = async (
  encryptedInput: BinaryInput,
  fileIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<Uint8Array> => {
  const encryptedBytes = await toBytes(encryptedInput)
  const documentFileKey = await hkdfSha256(dek, 'document-file-encryption')
  const aad = buildDocumentFileAAD(vaultId, ownerId)
  return decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: toBase64(encryptedBytes),
      ivB64: fileIv,
    },
    documentFileKey,
    aad,
  )
}

export const encryptAssetAttachmentName = async (
  name: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedName: string; nameIv: string }> => {
  const attachmentNameKey = await hkdfSha256(dek, 'asset-attachment-name-encryption')
  const aad = buildAssetAttachmentNameAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(encoder.encode(name), attachmentNameKey, aad)
  return {
    encryptedName: payload.ciphertextB64,
    nameIv: payload.ivB64,
  }
}

export const decryptAssetAttachmentName = async (
  encryptedName: string,
  nameIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<string> => {
  const attachmentNameKey = await hkdfSha256(dek, 'asset-attachment-name-encryption')
  const aad = buildAssetAttachmentNameAAD(vaultId, ownerId)
  const plaintext = await decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: encryptedName,
      ivB64: nameIv,
    },
    attachmentNameKey,
    aad,
  )
  return decoder.decode(plaintext)
}

export const encryptAssetAttachmentFile = async (
  fileInput: BinaryInput,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedBytes: Uint8Array; fileIv: string; encryptedSizeBytes: number }> => {
  const fileBytes = await toBytes(fileInput)
  const attachmentFileKey = await hkdfSha256(dek, 'asset-attachment-file-encryption')
  const aad = buildAssetAttachmentFileAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(fileBytes, attachmentFileKey, aad)
  const encryptedBytes = fromBase64(payload.ciphertextB64)
  return {
    encryptedBytes,
    fileIv: payload.ivB64,
    encryptedSizeBytes: encryptedBytes.byteLength,
  }
}

export const decryptAssetAttachmentFile = async (
  encryptedInput: BinaryInput,
  fileIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<Uint8Array> => {
  const encryptedBytes = await toBytes(encryptedInput)
  const attachmentFileKey = await hkdfSha256(dek, 'asset-attachment-file-encryption')
  const aad = buildAssetAttachmentFileAAD(vaultId, ownerId)
  return decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: toBase64(encryptedBytes),
      ivB64: fileIv,
    },
    attachmentFileKey,
    aad,
  )
}

export const encryptPolicyAttachmentName = async (
  name: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedName: string; nameIv: string }> => {
  const attachmentNameKey = await hkdfSha256(dek, 'policy-attachment-name-encryption')
  const aad = buildPolicyAttachmentNameAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(encoder.encode(name), attachmentNameKey, aad)
  return {
    encryptedName: payload.ciphertextB64,
    nameIv: payload.ivB64,
  }
}

export const decryptPolicyAttachmentName = async (
  encryptedName: string,
  nameIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<string> => {
  const attachmentNameKey = await hkdfSha256(dek, 'policy-attachment-name-encryption')
  const aad = buildPolicyAttachmentNameAAD(vaultId, ownerId)
  const plaintext = await decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: encryptedName,
      ivB64: nameIv,
    },
    attachmentNameKey,
    aad,
  )
  return decoder.decode(plaintext)
}

export const encryptPolicyAttachmentFile = async (
  fileInput: BinaryInput,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<{ encryptedBytes: Uint8Array; fileIv: string; encryptedSizeBytes: number }> => {
  const fileBytes = await toBytes(fileInput)
  const attachmentFileKey = await hkdfSha256(dek, 'policy-attachment-file-encryption')
  const aad = buildPolicyAttachmentFileAAD(vaultId, ownerId)
  const payload = await encryptAesGcmV1(fileBytes, attachmentFileKey, aad)
  const encryptedBytes = fromBase64(payload.ciphertextB64)
  return {
    encryptedBytes,
    fileIv: payload.ivB64,
    encryptedSizeBytes: encryptedBytes.byteLength,
  }
}

export const decryptPolicyAttachmentFile = async (
  encryptedInput: BinaryInput,
  fileIv: string,
  dek: Uint8Array,
  vaultId: string,
  ownerId: string,
): Promise<Uint8Array> => {
  const encryptedBytes = await toBytes(encryptedInput)
  const attachmentFileKey = await hkdfSha256(dek, 'policy-attachment-file-encryption')
  const aad = buildPolicyAttachmentFileAAD(vaultId, ownerId)
  return decryptAesGcmV1(
    {
      v: 1,
      alg: 'AES-256-GCM',
      ciphertextB64: toBase64(encryptedBytes),
      ivB64: fileIv,
    },
    attachmentFileKey,
    aad,
  )
}
