import {
  decryptSectionContent,
  encryptSectionContent,
  fetchBlobAsBase64,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { vaultApi, vaultSectionApi, type VaultResponse, type VaultSectionResponse } from '../clients/vault-api'
import { SECTION_ID } from '../../model/vault-section-types'

export type RecoveryPhraseVaultPayloadV1 = {
  v: 1
  mnemonic: string
  createdAt: string
}

const RECOVERY_SECTION_DISPLAY_NAME = 'Recovery phrase'
const RECOVERY_SECTION_ORDER = 9999

export async function persistRecoveryPhraseToVault(params: {
  ownerId: string
  publicKeyB64: string
  privateKeyB64: string
  pqPublicKeyB64: string | null
  pqPrivateKeyB64: string | null
  mnemonic: string
}): Promise<void> {
  const { vaults } = await vaultApi.listOwned()
  const first = vaults[0]
  if (!first) {
    return
  }

  const vault = await vaultApi.getById(first.id)

  const { sections } = await vaultSectionApi.list(vault.id)
  if (sections.some((s) => s.sectionType === SECTION_ID.RECOVERY)) {
    return
  }

  const dek = await unwrapDekWithKeyPair(
    vault.wrappedDek,
    params.publicKeyB64,
    params.privateKeyB64,
    params.pqPrivateKeyB64,
    { vaultId: vault.id },
  )

  const payload: RecoveryPhraseVaultPayloadV1 = {
    v: 1,
    mnemonic: params.mnemonic.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }

  const { encryptedData, encryptionIv } = await encryptSectionContent(
    payload,
    dek,
    vault.id,
    params.ownerId,
    SECTION_ID.RECOVERY,
  )

  await vaultSectionApi.create(vault.id, {
    sectionType: SECTION_ID.RECOVERY,
    sectionName: RECOVERY_SECTION_DISPLAY_NAME,
    displayOrder: RECOVERY_SECTION_ORDER,
    encryptedData,
    encryptionIv,
  })
}

/**
 * Creates or updates the vault `recovery` section so it matches the current recovery phrase.
 * Use after rotating the recovery key from Settings (signup/login uses {@link persistRecoveryPhraseToVault}).
 */
export async function upsertRecoveryPhraseToVault(params: {
  ownerId: string
  publicKeyB64: string
  privateKeyB64: string
  pqPublicKeyB64: string | null
  pqPrivateKeyB64: string | null
  mnemonic: string
}): Promise<void> {
  const { vaults } = await vaultApi.listOwned()
  const first = vaults[0]
  if (!first) {
    return
  }

  const vault = await vaultApi.getById(first.id)

  const { sections } = await vaultSectionApi.list(vault.id)
  const existing = sections.find((s) => s.sectionType === SECTION_ID.RECOVERY)

  const dek = await unwrapDekWithKeyPair(
    vault.wrappedDek,
    params.publicKeyB64,
    params.privateKeyB64,
    params.pqPrivateKeyB64,
    { vaultId: vault.id },
  )

  const payload: RecoveryPhraseVaultPayloadV1 = {
    v: 1,
    mnemonic: params.mnemonic.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }

  const { encryptedData, encryptionIv } = await encryptSectionContent(
    payload,
    dek,
    vault.id,
    params.ownerId,
    SECTION_ID.RECOVERY,
  )

  if (existing) {
    await vaultSectionApi.update(vault.id, existing.id, {
      encryptedData,
      encryptionIv,
      expectedVersion: existing.version,
    })
  } else {
    await vaultSectionApi.create(vault.id, {
      sectionType: SECTION_ID.RECOVERY,
      sectionName: RECOVERY_SECTION_DISPLAY_NAME,
      displayOrder: RECOVERY_SECTION_ORDER,
      encryptedData,
      encryptionIv,
    })
  }
}

export async function decryptRecoveryPhraseVaultPayload(params: {
  vault: VaultResponse
  section: VaultSectionResponse
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64: string | null
}): Promise<RecoveryPhraseVaultPayloadV1> {
  const dek = await unwrapDekWithKeyPair(
    params.vault.wrappedDek,
    params.publicKeyB64,
    params.privateKeyB64,
    params.pqPrivateKeyB64,
    { vaultId: params.vault.id },
  )
  const encryptedData = params.section.blobUrl
    ? await fetchBlobAsBase64(params.section.blobUrl)
    : (params.section.encryptedData ?? '')

  return decryptSectionContent<RecoveryPhraseVaultPayloadV1>(
    encryptedData,
    params.section.encryptionIv,
    dek,
    params.vault.id,
    params.vault.ownerId,
    SECTION_ID.RECOVERY,
  )
}
