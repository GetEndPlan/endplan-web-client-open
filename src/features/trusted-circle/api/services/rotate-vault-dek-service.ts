import { keysApi, type PublicKeyResponse } from '@/features/keys'
import {
  vaultApi,
  vaultDocumentsApi,
  vaultSectionApi,
  type VaultSectionResponse,
} from '@/features/endplan'
import {
  decryptDocumentFile,
  decryptDocumentName,
  decryptSectionContent,
  decryptVaultJson,
  encryptDocumentFile,
  encryptDocumentName,
  encryptSectionContent,
  encryptVaultJson,
  fetchBlobAsBase64,
  fetchBlobAsText,
  generateDek,
  type CryptoEnvelopeV1,
  unwrapDekWithKeyPair,
  recipientExpectsHybridWrap,
  wrapDekForPublicKey,
} from '@/shared/lib'
import { accessApi, type RotateVaultWrappedDEKItem } from '../clients/access-api'

const WRAPPED_DEK_ROTATION_ATTEMPTS = 5

type RotateAfterMemberRemovalParams = {
  removedMemberUserId: string
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPublicKeyB64?: string | null
  actorPqPrivateKeyB64?: string | null
}

type RotateAfterMemberRemovalResult = {
  attemptedVaults: number
  rotatedVaults: number
  failedVaults: Array<{ vaultId: string; reason: string }>
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Unknown rotation error'
}

function parseEnvelope(raw: string): CryptoEnvelopeV1 {
  if (!raw) {
    throw new Error('vault ciphertext is empty')
  }
  const parsed = JSON.parse(raw) as Partial<CryptoEnvelopeV1>
  if (
    parsed.v !== 1 ||
    parsed.alg !== 'AES-256-GCM' ||
    typeof parsed.ciphertextB64 !== 'string' ||
    typeof parsed.ivB64 !== 'string'
  ) {
    throw new Error('invalid vault encryption envelope')
  }
  return parsed as CryptoEnvelopeV1
}

async function getSectionCiphertext(section: VaultSectionResponse): Promise<string> {
  if (section.blobUrl) {
    return fetchBlobAsBase64(section.blobUrl)
  }
  return section.encryptedData ?? ''
}

function mergeWrappedDek(
  map: Map<string, string>,
  userId: string,
  wrappedDek: string,
  source: string,
) {
  const existing = map.get(userId)
  if (!existing) {
    map.set(userId, wrappedDek)
    return
  }
  if (existing !== wrappedDek) {
    throw new Error(`inconsistent wrapped DEK for user ${userId} in ${source}`)
  }
}

async function listActiveWrappedDekByUser(vaultId: string, sectionIds: string[]): Promise<Map<string, string>> {
  const wrappedByUser = new Map<string, string>()

  const vaultAccess = await accessApi.listVaultAccess(vaultId)
  for (const access of vaultAccess.access) {
    if (!access.isActive) continue
    mergeWrappedDek(wrappedByUser, access.userId, access.wrappedDek, 'vault access')
  }

  for (const sectionId of sectionIds) {
    const sectionAccess = await accessApi.listSectionAccess(sectionId)
    for (const access of sectionAccess.access) {
      if (!access.isActive) continue
      mergeWrappedDek(wrappedByUser, access.userId, access.wrappedDek, `section ${sectionId}`)
    }
  }

  return wrappedByUser
}

async function buildRotatedWrappedItems(params: {
  vaultId: string
  ownerId: string
  actorPublicKeyB64: string
  actorPqPublicKeyB64?: string | null
  newDek: Uint8Array
  activeUsers: string[]
  publicKeysByUserId: Map<string, PublicKeyResponse>
}): Promise<RotateVaultWrappedDEKItem[]> {
  const {
    vaultId,
    ownerId,
    actorPublicKeyB64,
    actorPqPublicKeyB64,
    newDek,
    activeUsers,
    publicKeysByUserId,
  } = params
  const items: RotateVaultWrappedDEKItem[] = []

  for (const userId of activeUsers) {
    const keyBundle = userId === ownerId
      ? {
          publicKeyB64: actorPublicKeyB64,
          pqPublicKeyB64: actorPqPublicKeyB64 ?? null,
          keyBundleVersion: actorPqPublicKeyB64 ? 2 : 1,
        }
      : publicKeysByUserId.get(userId)
    if (!keyBundle?.publicKeyB64) {
      throw new Error(`missing public key bundle for user ${userId}`)
    }

    const wrappedDek = await wrapDekForPublicKey(
      newDek,
      keyBundle.publicKeyB64,
      keyBundle.pqPublicKeyB64,
      {
        vaultId,
        requireHybrid: recipientExpectsHybridWrap(keyBundle),
      },
    )
    items.push({ userId, wrappedDek })
  }

  return items
}

async function listPublicKeyBundles(userIds: string[]): Promise<Map<string, PublicKeyResponse>> {
  const uniqueUserIds = [...new Set(userIds.filter((userId) => userId.trim() !== ''))]
  if (uniqueUserIds.length === 0) {
    return new Map()
  }

  const { keys } = await keysApi.listPublicKeys({ userIds: uniqueUserIds })
  return new Map(keys.map((keyBundle) => [keyBundle.userId, keyBundle]))
}

async function rotateDocuments(params: {
  vaultId: string
  ownerId: string
  oldDek: Uint8Array
  newDek: Uint8Array
}) {
  const { vaultId, ownerId, oldDek, newDek } = params
  const tree = await vaultDocumentsApi.getTree(vaultId)
  const folders = Array.isArray(tree.folders) ? tree.folders : []
  const files = Array.isArray(tree.files) ? tree.files : []

  for (const folder of folders) {
    const plainName = await decryptDocumentName(
      folder.encryptedName,
      folder.nameIv,
      oldDek,
      vaultId,
      ownerId,
    )
    const rotatedName = await encryptDocumentName(plainName, newDek, vaultId, ownerId)
    await vaultDocumentsApi.updateFolder(vaultId, folder.id, {
      encryptedName: rotatedName.encryptedName,
      nameIv: rotatedName.nameIv,
    })
  }

  for (const file of files) {
    if (!file.isUploaded || !file.fileIv) {
      continue
    }

    const plainName = await decryptDocumentName(
      file.encryptedName,
      file.nameIv,
      oldDek,
      vaultId,
      ownerId,
    )

    const payload = await vaultDocumentsApi.getDownloadURL(vaultId, file.id)
    const encryptedRes = await fetch(payload.downloadUrl)
    if (!encryptedRes.ok) {
      throw new Error(`failed to download encrypted file ${file.id}`)
    }
    const encryptedBytes = new Uint8Array(await encryptedRes.arrayBuffer())
    const plainBytes = await decryptDocumentFile(
      encryptedBytes,
      payload.file.fileIv ?? file.fileIv,
      oldDek,
      vaultId,
      ownerId,
    )

    const rotatedName = await encryptDocumentName(plainName, newDek, vaultId, ownerId)
    const initUpload = await vaultDocumentsApi.initUpload(vaultId, {
      folderId: file.folderId ?? undefined,
      encryptedName: rotatedName.encryptedName,
      nameIv: rotatedName.nameIv,
      mimeType: file.mimeType ?? undefined,
      originalSizeBytes: file.originalSizeBytes,
    })

    const rotatedFile = await encryptDocumentFile(plainBytes, newDek, vaultId, ownerId)
    const mimeType = file.mimeType || 'application/octet-stream'
    const uploadRes = await fetch(initUpload.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: new Blob([new Uint8Array(rotatedFile.encryptedBytes)], {
        type: mimeType,
      }),
    })
    if (!uploadRes.ok) {
      throw new Error(`failed to upload rotated file ${file.id}`)
    }

    await vaultDocumentsApi.completeUpload(vaultId, initUpload.file.id, {
      fileIv: rotatedFile.fileIv,
      encryptedSizeBytes: rotatedFile.encryptedSizeBytes,
    })
    await vaultDocumentsApi.deleteFile(vaultId, file.id)
  }
}

async function rotateSectionData(params: {
  vaultId: string
  ownerId: string
  oldDek: Uint8Array
  newDek: Uint8Array
  sections: VaultSectionResponse[]
}) {
  const { vaultId, ownerId, oldDek, newDek, sections } = params

  for (const section of sections) {
    const ciphertext = await getSectionCiphertext(section)
    if (!ciphertext || !section.encryptionIv) {
      continue
    }
    const sectionData = await decryptSectionContent(
      ciphertext,
      section.encryptionIv,
      oldDek,
      vaultId,
      ownerId,
      section.sectionType,
    )
    const rotated = await encryptSectionContent(
      sectionData,
      newDek,
      vaultId,
      ownerId,
      section.sectionType,
    )
    await vaultSectionApi.update(vaultId, section.id, {
      encryptedData: rotated.encryptedData,
      encryptionIv: rotated.encryptionIv,
      expectedVersion: section.version,
    })
  }
}

async function rotateVaultWrappedDekRows(
  vaultId: string,
  items: RotateVaultWrappedDEKItem[],
) {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= WRAPPED_DEK_ROTATION_ATTEMPTS; attempt += 1) {
    try {
      await accessApi.rotateVaultWrappedDEKs(vaultId, { items })
      return
    } catch (error) {
      lastError = error
      if (attempt < WRAPPED_DEK_ROTATION_ATTEMPTS) {
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 400))
      }
    }
  }
  throw new Error(`failed to rotate wrapped DEKs: ${toErrorMessage(lastError)}`)
}

async function rotateSingleVaultAfterMemberRemoval(params: {
  vaultId: string
  removedMemberUserId: string
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPublicKeyB64?: string | null
  actorPqPrivateKeyB64?: string | null
}) {
  const {
    vaultId,
    removedMemberUserId,
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPublicKeyB64,
    actorPqPrivateKeyB64,
  } = params

  const vault = await vaultApi.getById(vaultId)
  const oldDek = await unwrapDekWithKeyPair(
    vault.wrappedDek,
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPrivateKeyB64,
    { vaultId },
  )
  const newDek = generateDek()

  const sectionsResponse = await vaultSectionApi.list(vault.id)
  const sections = Array.isArray(sectionsResponse.sections) ? sectionsResponse.sections : []
  const sectionIds = sections.map((section) => section.id)
  const wrappedByUser = await listActiveWrappedDekByUser(vault.id, sectionIds)
  if (wrappedByUser.size === 0) {
    throw new Error('no active access rows found for rotation')
  }
  if (wrappedByUser.has(removedMemberUserId)) {
    throw new Error('removed member still has active access rows')
  }
  const publicKeysByUserId = await listPublicKeyBundles(
    [...wrappedByUser.keys()].filter((userId) => userId !== vault.ownerId),
  )

  const rotatedItems = await buildRotatedWrappedItems({
    vaultId,
    ownerId: vault.ownerId,
    actorPublicKeyB64,
    actorPqPublicKeyB64,
    newDek,
    activeUsers: [...wrappedByUser.keys()],
    publicKeysByUserId,
  })

  const encryptedVaultPayload = vault.blobUrl
    ? await fetchBlobAsText(vault.blobUrl)
    : (vault.encryptedData ?? '')
  const vaultEnvelope = parseEnvelope(encryptedVaultPayload)
  const vaultData = await decryptVaultJson(vaultEnvelope, oldDek, vault.id, vault.ownerId)
  const rotatedVaultEnvelope = await encryptVaultJson(vaultData, newDek, vault.id, vault.ownerId)

  const updateInput: {
    encryptedData: string
    encryptionIv: string
  } = {
    encryptedData: JSON.stringify(rotatedVaultEnvelope),
    encryptionIv: rotatedVaultEnvelope.ivB64,
  }

  await vaultApi.update(vault.id, updateInput)

  await rotateSectionData({
    vaultId: vault.id,
    ownerId: vault.ownerId,
    oldDek,
    newDek,
    sections,
  })

  await rotateDocuments({
    vaultId: vault.id,
    ownerId: vault.ownerId,
    oldDek,
    newDek,
  })

  await rotateVaultWrappedDekRows(vault.id, rotatedItems)
}

export async function rotateVaultDataAfterMemberRemoval(
  params: RotateAfterMemberRemovalParams,
): Promise<RotateAfterMemberRemovalResult> {
  const {
    removedMemberUserId,
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPublicKeyB64,
    actorPqPrivateKeyB64,
  } = params
  const ownedVaults = await vaultApi.listOwned()
  const vaults = Array.isArray(ownedVaults.vaults) ? ownedVaults.vaults : []

  const failedVaults: Array<{ vaultId: string; reason: string }> = []
  let rotatedVaults = 0

  for (const vault of vaults) {
    try {
      await rotateSingleVaultAfterMemberRemoval({
        vaultId: vault.id,
        removedMemberUserId,
        actorPublicKeyB64,
        actorPrivateKeyB64,
        actorPqPublicKeyB64,
        actorPqPrivateKeyB64,
      })
      rotatedVaults += 1
    } catch (error) {
      failedVaults.push({
        vaultId: vault.id,
        reason: toErrorMessage(error),
      })
    }
  }

  return {
    attemptedVaults: vaults.length,
    rotatedVaults,
    failedVaults,
  }
}
