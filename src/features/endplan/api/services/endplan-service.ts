import {
  generateDek,
  encryptVaultJson,
  decryptVaultJson,
  wrapDekForPublicKey,
  unwrapDekWithKeyPair,
  type CryptoEnvelopeV1,
  fetchBlobAsText,
} from '@/shared/lib'
import { vaultApi, type VaultResponse } from '../clients/vault-api'
import { accessApi } from '@/features/trusted-circle/api/clients/access-api'
import { wrapDekForReleaseIfAvailable } from './release-key-helper'
import { isEmptyVaultEnvelope } from './empty-vault-envelope'

const EMPTY_ENVELOPE: CryptoEnvelopeV1 = {
  v: 1,
  alg: 'AES-256-GCM',
  ciphertextB64: '',
  ivB64: '',
}

export type EndPlanData = {
  content: string
  title?: string
  createdAt: string
  updatedAt: string
}

type CreateVaultShellParams = {
  name?: string
  description?: string
  wrappedDek: string
  wrappedDekReleaseB64?: string
}

type EncryptAndUpdateVaultParams = {
  vault: VaultResponse
  dek: Uint8Array
  ownerId: string
  vaultData: EndPlanData
  name?: string
  description?: string
  wrappedDekReleaseB64?: string
}

type CreateNewEncryptedVaultParams = {
  name?: string
  description?: string
  content: string
  title?: string
  publicKeyB64: string
  pqPublicKeyB64?: string | null
  ownerId: string
  createdAt: string
}

function buildEndPlanData(params: { content: string; title?: string; createdAt: string }): EndPlanData {
  const { content, title, createdAt } = params
  return {
    content,
    title,
    createdAt,
    updatedAt: new Date().toISOString(),
  }
}

async function unwrapVaultDek(params: {
  vault: VaultResponse
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
}): Promise<Uint8Array> {
  const { vault, publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = params
  return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
    vaultId: vault.id,
  })
}

async function createVaultShell(params: CreateVaultShellParams): Promise<VaultResponse> {
  const { name, description, wrappedDek, wrappedDekReleaseB64 } = params
  return vaultApi.create({
    name,
    description,
    encryptedData: JSON.stringify(EMPTY_ENVELOPE),
    encryptionIv: '',
    wrappedDek,
    wrappedDekReleaseB64,
  })
}

async function encryptAndUpdateVault(params: EncryptAndUpdateVaultParams): Promise<VaultResponse> {
  const {
    vault,
    dek,
    ownerId,
    vaultData,
    name,
    description,
    wrappedDekReleaseB64,
  } = params

  const encrypted = await encryptVaultJson(vaultData, dek, vault.id, ownerId)

  return vaultApi.update(vault.id, {
    name,
    description,
    encryptedData: JSON.stringify(encrypted),
    encryptionIv: encrypted.ivB64,
    wrappedDekReleaseB64,
  })
}

async function createNewEncryptedVault(params: CreateNewEncryptedVaultParams): Promise<VaultResponse> {
  const {
    name,
    description,
    content,
    title,
    publicKeyB64,
    pqPublicKeyB64,
    ownerId,
    createdAt,
  } = params

  const dek = generateDek()
  // Shell create requires a wrappedDek before the vault id exists. Wrap a throwaway value so the
  // real DEK never leaves the device as a classic (X25519-only) provisional wrap. Rewrap with the
  // real DEK (hybrid when the owner has PQ) after create returns, then encrypt content.
  const provisionalWrappedDek = await wrapDekForPublicKey(generateDek(), publicKeyB64, null)

  const shellVault = await createVaultShell({
    name,
    description,
    wrappedDek: provisionalWrappedDek,
  })

  const ownerRequiresHybrid = !!pqPublicKeyB64?.trim()
  const wrappedDek = await wrapDekForPublicKey(dek, publicKeyB64, pqPublicKeyB64, {
    vaultId: shellVault.id,
    requireHybrid: ownerRequiresHybrid,
  })
  const wrappedDekReleaseB64 = await wrapDekForReleaseIfAvailable(dek)

  // Must succeed before content encryption so the stored owner wrap matches the content DEK.
  await accessApi.rewrapOwnWrappedDEK(shellVault.id, { wrappedDek })

  const vaultWithOwnerWrap: VaultResponse = {
    ...shellVault,
    wrappedDek,
    wrappedDekReleaseB64,
  }

  const vaultData = buildEndPlanData({ content, title, createdAt })

  return encryptAndUpdateVault({
    vault: vaultWithOwnerWrap,
    dek,
    ownerId,
    vaultData,
    wrappedDekReleaseB64,
  })
}

/**
 * Create an initial empty vault for a new user (called during signup)
 * Two-phase: create vault shell first, then encrypt with real vaultId
 */
export async function createInitialVault(
  publicKeyB64: string,
  ownerId: string,
  pqPublicKeyB64?: string | null,
): Promise<VaultResponse> {
  return createNewEncryptedVault({
    content: '',
    title: '',
    publicKeyB64,
    pqPublicKeyB64,
    ownerId,
    createdAt: new Date().toISOString(),
  })
}

/**
 * Check if the decrypted EndPlan data has actual content
 * Returns true if content is empty or not provided
 */
export function isEndPlanEmpty(data: EndPlanData | null): boolean {
  if (!data) return true
  return !data.content || data.content.trim() === ''
}

function emptyEndPlanData(vault: Pick<VaultResponse, 'createdAt' | 'updatedAt'>): EndPlanData {
  return {
    content: '',
    title: '',
    createdAt: vault.createdAt,
    updatedAt: vault.updatedAt || vault.createdAt,
  }
}

/**
 * Parse stored encrypted data as CryptoEnvelopeV1
 */
function parseEncryptedPayload(encryptedData: string): CryptoEnvelopeV1 {
  const parsed = JSON.parse(encryptedData)
  if (parsed.v !== 1 || parsed.alg !== 'AES-256-GCM') {
    throw new Error('Invalid crypto envelope - expected v1 AES-256-GCM')
  }
  if (typeof parsed.ciphertextB64 !== 'string' || typeof parsed.ivB64 !== 'string') {
    throw new Error('Invalid crypto envelope - missing ciphertext or iv')
  }
  return {
    v: 1,
    alg: 'AES-256-GCM',
    ciphertextB64: parsed.ciphertextB64,
    ivB64: parsed.ivB64,
  }
}

/**
 * Decrypt an EndPlan's content
 */
export async function decryptEndPlan(params: {
  vault: VaultResponse
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
}): Promise<EndPlanData> {
  const { vault, publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = params

  const encryptedData = vault.blobUrl
    ? await fetchBlobAsText(vault.blobUrl)
    : (vault.encryptedData ?? '')
  const payload = parseEncryptedPayload(encryptedData)
  if (isEmptyVaultEnvelope(payload)) {
    return emptyEndPlanData(vault)
  }

  const dek = await unwrapVaultDek({ vault, publicKeyB64, privateKeyB64, pqPrivateKeyB64 })

  return decryptVaultJson<EndPlanData>(
    payload,
    dek,
    vault.id,
    vault.ownerId,
  )
}

/**
 * Create or update the user's EndPlan
 * If vault exists, updates it
 * If no vault exists, creates one (two-phase: create shell, then encrypt with real vaultId)
 */
export async function createOrUpdateEndPlan(params: {
  existingVault: VaultResponse | null
  name: string
  description?: string
  content: string
  publicKeyB64: string
  pqPublicKeyB64?: string | null
  privateKeyB64?: string
  pqPrivateKeyB64?: string | null
  ownerId: string
}): Promise<VaultResponse> {
  const {
    existingVault,
    name,
    description,
    content,
    publicKeyB64,
    pqPublicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    ownerId,
  } = params

  if (!existingVault || !privateKeyB64) {
    return createNewEncryptedVault({
      name,
      description,
      content,
      title: name,
      publicKeyB64,
      pqPublicKeyB64,
      ownerId,
      createdAt: new Date().toISOString(),
    })
  }

  const dek = await unwrapVaultDek({
    vault: existingVault,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
  })

  const vaultData = buildEndPlanData({
    content,
    title: name,
    createdAt: existingVault.createdAt,
  })

  return encryptAndUpdateVault({
    vault: existingVault,
    dek,
    ownerId: existingVault.ownerId,
    vaultData,
    name,
    description,
  })
}

/**
 * Update the user's EndPlan content (for edit page)
 */
export async function saveEndPlan(params: {
  vault: VaultResponse
  name?: string
  description?: string
  content: string
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
}): Promise<VaultResponse> {
  const { vault, name, description, content, publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = params

  const dek = await unwrapVaultDek({
    vault,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
  })

  const vaultData = buildEndPlanData({
    content,
    title: name || vault.name,
    createdAt: vault.createdAt,
  })

  const wrappedDekReleaseB64 = vault.wrappedDekReleaseB64
    ? undefined
    : await wrapDekForReleaseIfAvailable(dek)

  return encryptAndUpdateVault({
    vault,
    dek,
    ownerId: vault.ownerId,
    vaultData,
    name,
    description,
    wrappedDekReleaseB64,
  })
}
