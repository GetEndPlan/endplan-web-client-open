import {
  ACTIVE_PASSWORD_KDF_ALGORITHM,
  ACTIVE_SHARED_SECRET_KDF_ALGORITHM,
  CONFIGURED_KEY_ALGORITHMS,
  ML_KEM_768_ALGORITHM,
  PRIMARY_KEY_EXCHANGE_ALGORITHM,
  X25519_ALGORITHM,
  hasConfiguredKeyAlgorithm,
  isMlKem768WrappingEnabled,
} from '../config/algorithms'
import { getMlKemSupportError, mlKem768WrappingAlgorithm } from './ml-kem'
import {
  HYBRID_KEM_WRAPPING_VERSION,
  isHybridKemWrappedDekEnvelope,
  unwrapDekHybridKem,
  wrapDekHybridKem,
} from './hybrid-kem-v3'
import type {
  DekWrapContext,
  HybridWrappedDekEnvelope,
  MlKemWrappedDekEntry,
  PrivateKeyBundle,
  UserKeyBundle,
  WrappedDekEntry,
  WrappedDekEnvelope,
  WrappedDekMetadata,
  X25519WrappedDekEntry,
  X25519WrappedDekEnvelope,
} from '../types'
import { unwrapDekFromSealedBox, x25519WrappingAlgorithm } from './x25519'

export type { DekWrapContext }
export { CLASSIC_WRAPPING_VERSION, HYBRID_KEM_WRAPPING_VERSION } from './hybrid-kem-v3'

function assertRequiredAlgorithmsConfigured(): void {
  if (!hasConfiguredKeyAlgorithm(PRIMARY_KEY_EXCHANGE_ALGORITHM)) {
    throw new Error(
      `Primary key-exchange algorithm "${PRIMARY_KEY_EXCHANGE_ALGORITHM}" is not in the configured keyAlgorithms list`,
    )
  }
}

async function assertConfiguredAlgorithmsSupported(): Promise<void> {
  const unsupportedAlgorithmMessages: string[] = []

  if (hasConfiguredKeyAlgorithm(X25519_ALGORITHM) && !(await x25519WrappingAlgorithm.isSupported())) {
    unsupportedAlgorithmMessages.push('X25519 is not supported in this runtime')
  }

  if (isMlKem768WrappingEnabled() && !(await mlKem768WrappingAlgorithm.isSupported())) {
    const supportError = getMlKemSupportError()
    unsupportedAlgorithmMessages.push(
      supportError
        ? `ML-KEM-768 initialization failed: ${supportError.message}`
        : 'ML-KEM-768 is not supported in this runtime',
    )
  }

  if (unsupportedAlgorithmMessages.length > 0) {
    throw new Error(unsupportedAlgorithmMessages.join(' | '))
  }
}

function isX25519WrappedDekEntry(entry: unknown): entry is X25519WrappedDekEntry {
  if (!entry || typeof entry !== 'object') {
    return false
  }
  const candidate = entry as Partial<X25519WrappedDekEntry>
  return (
    candidate.algorithm === X25519_ALGORITHM &&
    !!candidate.payload &&
    typeof candidate.payload === 'object' &&
    typeof candidate.payload.ephemeralPublicKeyB64 === 'string' &&
    typeof candidate.payload.ciphertextB64 === 'string' &&
    typeof candidate.payload.ivB64 === 'string'
  )
}

function isMlKemWrappedDekEntry(entry: unknown): entry is MlKemWrappedDekEntry {
  if (!entry || typeof entry !== 'object') {
    return false
  }
  const candidate = entry as Partial<MlKemWrappedDekEntry>
  return (
    candidate.algorithm === ML_KEM_768_ALGORITHM &&
    !!candidate.payload &&
    typeof candidate.payload === 'object' &&
    typeof candidate.payload.pqCiphertextB64 === 'string' &&
    typeof candidate.payload.ciphertextB64 === 'string' &&
    typeof candidate.payload.ivB64 === 'string'
  )
}

function isWrappedDekEntry(entry: unknown): entry is WrappedDekEntry {
  return isX25519WrappedDekEntry(entry) || isMlKemWrappedDekEntry(entry)
}

function parseWrappedDekEnvelope(wrappedDek: string): WrappedDekEnvelope | null {
  const trimmed = wrappedDek.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<WrappedDekEnvelope>
    if (
      typeof parsed.wrappingVersion !== 'number' ||
      typeof parsed.wrappingScheme !== 'string' ||
      typeof parsed.asymmetricAlg !== 'string' ||
      typeof parsed.kdfAlg !== 'string'
    ) {
      return null
    }

    if (parsed.wrappingVersion === 1) {
      if (
        typeof (parsed as Partial<X25519WrappedDekEnvelope>).ephemeralPublicKeyB64 !== 'string' ||
        typeof (parsed as Partial<X25519WrappedDekEnvelope>).ciphertextB64 !== 'string' ||
        typeof (parsed as Partial<X25519WrappedDekEnvelope>).ivB64 !== 'string'
      ) {
        return null
      }
      return parsed as WrappedDekEnvelope
    }

    if (parsed.wrappingVersion === 2) {
      const candidate = parsed as Partial<HybridWrappedDekEnvelope>
      if (
        !Array.isArray(candidate.keyAlgorithms) ||
        !Array.isArray(candidate.wraps) ||
        candidate.wraps.length === 0 ||
        !candidate.wraps.every(isWrappedDekEntry)
      ) {
        return null
      }
      return candidate as WrappedDekEnvelope
    }

    if (parsed.wrappingVersion === HYBRID_KEM_WRAPPING_VERSION && isHybridKemWrappedDekEnvelope(parsed)) {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

async function unwrapFromEnvelope(
  envelope: WrappedDekEnvelope,
  publicKeyB64: string,
  privateKeyB64: string,
  pqPrivateKeyB64?: string | null,
  context?: DekWrapContext,
): Promise<Uint8Array> {
  if (envelope.wrappingVersion === 1) {
    return x25519WrappingAlgorithm.unwrapDek(
      {
        algorithm: X25519_ALGORITHM,
        payload: {
          ephemeralPublicKeyB64: envelope.ephemeralPublicKeyB64,
          ciphertextB64: envelope.ciphertextB64,
          ivB64: envelope.ivB64,
        },
      },
      privateKeyB64,
    )
  }

  if (envelope.wrappingVersion === HYBRID_KEM_WRAPPING_VERSION) {
    if (!pqPrivateKeyB64) {
      throw new Error('Unable to unwrap DEK with the hybrid recipient keys')
    }
    return unwrapDekHybridKem({
      envelope,
      recipientPublicKeyB64: publicKeyB64,
      recipientPrivateKeyB64: privateKeyB64,
      recipientPqPrivateKeyB64: pqPrivateKeyB64,
      context: context ?? { vaultId: '' },
    })
  }

  for (const algorithmName of CONFIGURED_KEY_ALGORITHMS) {
    const entry = envelope.wraps.find((candidate) => candidate.algorithm === algorithmName)
    if (!entry) {
      continue
    }

    try {
      if (entry.algorithm === X25519_ALGORITHM) {
        return x25519WrappingAlgorithm.unwrapDek(entry, privateKeyB64)
      }
      if (entry.algorithm === ML_KEM_768_ALGORITHM && pqPrivateKeyB64 && isMlKem768WrappingEnabled()) {
        return mlKem768WrappingAlgorithm.unwrapDek(entry, pqPrivateKeyB64)
      }
    } catch {
      continue
    }
  }

  throw new Error('Unable to unwrap DEK with the configured key algorithms')
}

export async function generateUserKeyBundle(): Promise<UserKeyBundle> {
  assertRequiredAlgorithmsConfigured()
  await assertConfiguredAlgorithmsSupported()

  const x25519 = await x25519WrappingAlgorithm.generateKeyPair()
  if (!isMlKem768WrappingEnabled()) {
    return {
      publicKeyB64: x25519.publicKeyB64,
      privateKeyB64: x25519.privateKeyB64,
      keyAlgorithm: x25519.algorithm,
      keyBundleVersion: 1,
      passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
    }
  }

  const pq = await mlKem768WrappingAlgorithm.generateKeyPair()
  return {
    publicKeyB64: x25519.publicKeyB64,
    privateKeyB64: x25519.privateKeyB64,
    keyAlgorithm: x25519.algorithm,
    pqPublicKeyB64: pq.publicKeyB64,
    pqPrivateKeyB64: pq.privateKeyB64,
    pqKeyAlgorithm: pq.algorithm,
    keyBundleVersion: 2,
    passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
  }
}

/**
 * True when the recipient is expected to receive a hybrid (v3) wrap.
 * Used to refuse silent classic fallback if the server omits a PQ public key.
 */
export function recipientExpectsHybridWrap(recipient: {
  pqPublicKeyB64?: string | null
  keyBundleVersion?: number | null
}): boolean {
  if (recipient.pqPublicKeyB64?.trim()) {
    return true
  }
  return (recipient.keyBundleVersion ?? 0) >= 2
}

export async function wrapDekForPublicKey(
  dek: Uint8Array,
  recipientPublicKeyB64: string,
  recipientPqPublicKeyB64?: string | null,
  context?: DekWrapContext,
): Promise<string> {
  assertRequiredAlgorithmsConfigured()

  const recipientPqPublic = recipientPqPublicKeyB64?.trim() ?? ''
  const requireHybrid = context?.requireHybrid === true

  if (recipientPqPublic && isMlKem768WrappingEnabled()) {
    if (!(await x25519WrappingAlgorithm.isSupported()) || !(await mlKem768WrappingAlgorithm.isSupported())) {
      throw new Error('Hybrid DEK wrapping requires X25519 and ML-KEM-768 support')
    }
    const envelope = await wrapDekHybridKem({
      dek,
      recipientPublicKeyB64,
      recipientPqPublicKeyB64: recipientPqPublic,
      context: context ?? { vaultId: '' },
    })
    return JSON.stringify(envelope)
  }

  if (requireHybrid) {
    if (recipientPqPublic && !isMlKem768WrappingEnabled()) {
      throw new Error('Hybrid DEK wrapping is required but ML-KEM-768 wrapping is disabled')
    }
    throw new Error('Hybrid DEK wrapping is required but recipient PQ public key is missing')
  }

  if (!recipientPublicKeyB64.trim() || !x25519WrappingAlgorithm.isEnabled() || !(await x25519WrappingAlgorithm.isSupported())) {
    throw new Error('No enabled key-wrapping algorithm is available for this recipient')
  }

  const wrapped = await x25519WrappingAlgorithm.wrapDek(dek, recipientPublicKeyB64)
  return JSON.stringify({
    wrappingVersion: 1,
    wrappingScheme: 'x25519-hkdf-aes-256-gcm',
    asymmetricAlg: X25519_ALGORITHM,
    kdfAlg: ACTIVE_SHARED_SECRET_KDF_ALGORITHM,
    ephemeralPublicKeyB64: wrapped.payload.ephemeralPublicKeyB64,
    ciphertextB64: wrapped.payload.ciphertextB64,
    ivB64: wrapped.payload.ivB64,
  } satisfies X25519WrappedDekEnvelope)
}

export async function unwrapDekWithKeyPair(
  wrappedDek: string,
  publicKeyB64: string,
  privateKeyB64: string,
  pqPrivateKeyB64?: string | null,
  context?: DekWrapContext,
): Promise<Uint8Array> {
  const envelope = parseWrappedDekEnvelope(wrappedDek)
  if (envelope) {
    return unwrapFromEnvelope(envelope, publicKeyB64, privateKeyB64, pqPrivateKeyB64, context)
  }

  // Legacy fallback: raw sealed-box base64 (pre-envelope wrapped DEKs)
  return unwrapDekFromSealedBox(wrappedDek, publicKeyB64, privateKeyB64)
}

export function getWrappedDekMetadata(wrappedDek: string): WrappedDekMetadata {
  const envelope = parseWrappedDekEnvelope(wrappedDek)
  if (envelope) {
    return {
      wrappingVersion: envelope.wrappingVersion,
      wrappingScheme: envelope.wrappingScheme,
      asymmetricAlg: envelope.asymmetricAlg,
      kemAlg: envelope.kemAlg ?? null,
      kdfAlg: envelope.kdfAlg,
      keyAlgorithms: envelope.keyAlgorithms ?? [X25519_ALGORITHM],
    }
  }

  return {
    wrappingVersion: 0,
    wrappingScheme: 'unknown',
    asymmetricAlg: X25519_ALGORITHM,
    kemAlg: null,
    kdfAlg: ACTIVE_SHARED_SECRET_KDF_ALGORITHM,
    keyAlgorithms: null,
  }
}

export function isWrappedDekEnvelopeString(wrappedDek: string): boolean {
  return parseWrappedDekEnvelope(wrappedDek) != null
}

export async function upgradeKeyBundleIfSupported(
  current: PrivateKeyBundle,
): Promise<UserKeyBundle | null> {
  if (current.pqPublicKeyB64 && current.pqPrivateKeyB64) {
    return {
      ...current,
      keyAlgorithm: current.keyAlgorithm ?? X25519_ALGORITHM,
      pqKeyAlgorithm: current.pqKeyAlgorithm ?? ML_KEM_768_ALGORITHM,
      keyBundleVersion: 2,
      passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
    }
  }

  if (!isMlKem768WrappingEnabled()) {
    return null
  }

  await assertConfiguredAlgorithmsSupported()

  const pq = await mlKem768WrappingAlgorithm.generateKeyPair()
  return {
    ...current,
    keyAlgorithm: current.keyAlgorithm ?? X25519_ALGORITHM,
    pqPublicKeyB64: pq.publicKeyB64,
    pqPrivateKeyB64: pq.privateKeyB64,
    pqKeyAlgorithm: pq.algorithm,
    keyBundleVersion: 2,
    passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
  }
}
