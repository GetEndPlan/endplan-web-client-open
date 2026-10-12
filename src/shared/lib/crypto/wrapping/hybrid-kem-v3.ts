import {
  decryptAesGcmV1,
  encryptAesGcmV1,
  hkdfSha256,
} from '../core/core'
import type { DekWrapContext, HybridKemWrappedDekEnvelope } from '../types'
import { decapsulateMlKemSecret, encapsulateMlKemSecret } from './ml-kem'
import { x25519WrappingAlgorithm } from './x25519'

const encoder = new TextEncoder()

export const CLASSIC_WRAPPING_VERSION = 1
export const HYBRID_KEM_WRAPPING_VERSION = 3
export const HYBRID_KEM_WRAPPING_SCHEME = 'hybrid-x25519-mlkem768-hkdf-aes-256-gcm' as const
export const HYBRID_KEM_WRAP_INFO = 'endplan/dek-wrap/hybrid-x25519-mlkem768/v3'

const DEK_BYTES = 32

export type { DekWrapContext }

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const out = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new Uint8Array(data))
  return new Uint8Array(digest)
}

/**
 * Canonical context committed as AES-GCM additional data and as the HKDF salt.
 * Field separators are safe: vault ids and base64 do not contain `|`.
 */
export function buildHybridKemWrapAad(input: {
  vaultId: string
  recipientPublicKeyB64: string
  recipientPqPublicKeyB64: string
  ephemeralPublicKeyB64: string
  pqCiphertextB64: string
}): string {
  return [
    'v=3',
    `scheme=${HYBRID_KEM_WRAPPING_SCHEME}`,
    'kdf=HKDF-SHA256',
    'algs=X25519+ML-KEM-768',
    `vault=${input.vaultId}`,
    `x25519=${input.recipientPublicKeyB64}`,
    `mlkem=${input.recipientPqPublicKeyB64}`,
    `eph=${input.ephemeralPublicKeyB64}`,
    `pqct=${input.pqCiphertextB64}`,
  ].join('|')
}

function assertDek(dek: Uint8Array): void {
  if (dek.byteLength !== DEK_BYTES) {
    throw new Error('DEK must be 32 bytes')
  }
}

function requireVaultId(context: DekWrapContext | undefined): string {
  const vaultId = context?.vaultId?.trim() ?? ''
  if (!vaultId) {
    throw new Error('Vault id is required for hybrid DEK wrapping')
  }
  return vaultId
}

async function deriveHybridWrappingKey(params: {
  x25519SharedSecret: Uint8Array
  mlKemSharedSecret: Uint8Array
  aad: string
}): Promise<Uint8Array> {
  const ikm = concatBytes([params.x25519SharedSecret, params.mlKemSharedSecret])
  const salt = await sha256(encoder.encode(params.aad))
  return hkdfSha256(ikm, HYBRID_KEM_WRAP_INFO, 32, salt)
}

export function isHybridKemWrappedDekEnvelope(value: unknown): value is HybridKemWrappedDekEnvelope {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<HybridKemWrappedDekEnvelope>
  return (
    candidate.wrappingVersion === HYBRID_KEM_WRAPPING_VERSION &&
    candidate.wrappingScheme === HYBRID_KEM_WRAPPING_SCHEME &&
    candidate.asymmetricAlg === 'X25519' &&
    candidate.kemAlg === 'ML-KEM-768' &&
    candidate.kdfAlg === 'HKDF-SHA256' &&
    Array.isArray(candidate.keyAlgorithms) &&
    candidate.keyAlgorithms.length === 2 &&
    candidate.keyAlgorithms[0] === 'X25519' &&
    candidate.keyAlgorithms[1] === 'ML-KEM-768' &&
    typeof candidate.vaultId === 'string' &&
    candidate.vaultId.trim() !== '' &&
    typeof candidate.recipientPublicKeyB64 === 'string' &&
    typeof candidate.recipientPqPublicKeyB64 === 'string' &&
    typeof candidate.ephemeralPublicKeyB64 === 'string' &&
    typeof candidate.pqCiphertextB64 === 'string' &&
    typeof candidate.ciphertextB64 === 'string' &&
    typeof candidate.ivB64 === 'string'
  )
}

export async function wrapDekHybridKem(params: {
  dek: Uint8Array
  recipientPublicKeyB64: string
  recipientPqPublicKeyB64: string
  context: DekWrapContext
}): Promise<HybridKemWrappedDekEnvelope> {
  const { dek, recipientPublicKeyB64, recipientPqPublicKeyB64 } = params
  assertDek(dek)
  const vaultId = requireVaultId(params.context)
  const recipientPublic = recipientPublicKeyB64.trim()
  const recipientPqPublic = recipientPqPublicKeyB64.trim()
  if (!recipientPublic || !recipientPqPublic) {
    throw new Error('Hybrid DEK wrapping requires both recipient public keys')
  }

  const ephemeral = await x25519WrappingAlgorithm.generateKeyPair()
  const x25519SharedSecret = new Uint8Array(
    await x25519WrappingAlgorithm.deriveSharedSecret(ephemeral.privateKeyB64, recipientPublic),
  )
  const encapsulated = await encapsulateMlKemSecret(recipientPqPublic)
  const aad = buildHybridKemWrapAad({
    vaultId,
    recipientPublicKeyB64: recipientPublic,
    recipientPqPublicKeyB64: recipientPqPublic,
    ephemeralPublicKeyB64: ephemeral.publicKeyB64,
    pqCiphertextB64: encapsulated.pqCiphertextB64,
  })
  const wrappingKey = await deriveHybridWrappingKey({
    x25519SharedSecret,
    mlKemSharedSecret: encapsulated.sharedSecret,
    aad,
  })
  const encrypted = await encryptAesGcmV1(dek, wrappingKey, aad)

  return {
    wrappingVersion: HYBRID_KEM_WRAPPING_VERSION,
    wrappingScheme: HYBRID_KEM_WRAPPING_SCHEME,
    asymmetricAlg: 'X25519',
    kemAlg: 'ML-KEM-768',
    kdfAlg: 'HKDF-SHA256',
    keyAlgorithms: ['X25519', 'ML-KEM-768'],
    vaultId,
    recipientPublicKeyB64: recipientPublic,
    recipientPqPublicKeyB64: recipientPqPublic,
    ephemeralPublicKeyB64: ephemeral.publicKeyB64,
    pqCiphertextB64: encapsulated.pqCiphertextB64,
    ciphertextB64: encrypted.ciphertextB64,
    ivB64: encrypted.ivB64,
  }
}

export async function unwrapDekHybridKem(params: {
  envelope: HybridKemWrappedDekEnvelope
  recipientPublicKeyB64: string
  recipientPrivateKeyB64: string
  recipientPqPrivateKeyB64: string
  context: DekWrapContext
}): Promise<Uint8Array> {
  const { envelope, recipientPrivateKeyB64, recipientPqPrivateKeyB64 } = params
  const vaultId = requireVaultId(params.context)
  const recipientPublic = params.recipientPublicKeyB64.trim()
  if (
    vaultId !== envelope.vaultId ||
    recipientPublic !== envelope.recipientPublicKeyB64
  ) {
    throw new Error('Unable to unwrap DEK with the hybrid recipient keys')
  }

  const x25519SharedSecret = new Uint8Array(
    await x25519WrappingAlgorithm.deriveSharedSecret(
      recipientPrivateKeyB64,
      envelope.ephemeralPublicKeyB64,
    ),
  )
  const mlKemSharedSecret = await decapsulateMlKemSecret(
    envelope.pqCiphertextB64,
    recipientPqPrivateKeyB64,
  )
  const aad = buildHybridKemWrapAad({
    vaultId,
    recipientPublicKeyB64: recipientPublic,
    recipientPqPublicKeyB64: envelope.recipientPqPublicKeyB64,
    ephemeralPublicKeyB64: envelope.ephemeralPublicKeyB64,
    pqCiphertextB64: envelope.pqCiphertextB64,
  })
  const wrappingKey = await deriveHybridWrappingKey({
    x25519SharedSecret,
    mlKemSharedSecret,
    aad,
  })

  try {
    const dek = await decryptAesGcmV1(
      {
        v: 1,
        alg: 'AES-256-GCM',
        ciphertextB64: envelope.ciphertextB64,
        ivB64: envelope.ivB64,
      },
      wrappingKey,
      aad,
    )
    assertDek(dek)
    return dek
  } catch {
    throw new Error('Unable to unwrap DEK with the hybrid recipient keys')
  }
}
