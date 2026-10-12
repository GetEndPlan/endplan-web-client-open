import { X25519_ALGORITHM, isX25519WrappingEnabled } from '../config/algorithms'
import { cryptoEncoding, decryptPrivateKey, encryptPrivateKey, hkdfSha256 } from '../core/core'
import type { KeyWrappingAlgorithm } from './key-wrapping-algorithm'
import type { X25519WrappedDekEntry } from '../types'

type SodiumNamespace = typeof import('libsodium-wrappers-sumo')
type SodiumModule = SodiumNamespace extends { default: infer T } ? T : SodiumNamespace

const { toBase64, fromBase64 } = cryptoEncoding

let sodiumPromise: Promise<SodiumModule> | null = null

const loadSodium = async (): Promise<SodiumModule> => {
  if (!sodiumPromise) {
    sodiumPromise = import('libsodium-wrappers-sumo').then(async (module) => {
      const sodiumModule = ('default' in module ? module.default : module) as SodiumModule
      await sodiumModule.ready
      return sodiumModule
    })
  }
  return sodiumPromise
}

async function encryptWrappedDek(dek: Uint8Array, wrappingKey: Uint8Array) {
  const payload = await encryptPrivateKey(toBase64(dek), wrappingKey)
  return {
    ciphertextB64: payload.ciphertextB64,
    ivB64: payload.ivB64,
  }
}

async function decryptWrappedDek(
  ciphertextB64: string,
  ivB64: string,
  wrappingKey: Uint8Array,
): Promise<Uint8Array> {
  const dekB64 = await decryptPrivateKey({ ciphertextB64, ivB64 }, wrappingKey)
  return fromBase64(dekB64)
}

export class X25519WrappingAlgorithm implements KeyWrappingAlgorithm<'X25519', X25519WrappedDekEntry> {
  readonly algorithm = X25519_ALGORITHM

  isEnabled(): boolean {
    return isX25519WrappingEnabled()
  }

  async isSupported(): Promise<boolean> {
    try {
      await loadSodium()
      return true
    } catch {
      return false
    }
  }

  async generateKeyPair() {
    const sodium = await loadSodium()
    const { publicKey, privateKey } = sodium.crypto_box_keypair()
    return {
      publicKeyB64: toBase64(publicKey),
      privateKeyB64: toBase64(privateKey),
      algorithm: this.algorithm,
    }
  }

  async wrapDek(dek: Uint8Array, recipientPublicKeyB64: string): Promise<X25519WrappedDekEntry> {
    const ephemeral = await this.generateKeyPair()
    const sharedSecret = await this.deriveSharedSecret(ephemeral.privateKeyB64, recipientPublicKeyB64)
    const wrappingKey = await hkdfSha256(sharedSecret, 'dek-wrapping-x25519')
    const wrapped = await encryptWrappedDek(dek, wrappingKey)

    return {
      algorithm: this.algorithm,
      payload: {
        ephemeralPublicKeyB64: ephemeral.publicKeyB64,
        ciphertextB64: wrapped.ciphertextB64,
        ivB64: wrapped.ivB64,
      },
    }
  }

  async unwrapDek(entry: X25519WrappedDekEntry, privateKeyB64: string): Promise<Uint8Array> {
    const sharedSecret = await this.deriveSharedSecret(
      privateKeyB64,
      entry.payload.ephemeralPublicKeyB64,
    )
    const wrappingKey = await hkdfSha256(sharedSecret, 'dek-wrapping-x25519')
    return decryptWrappedDek(entry.payload.ciphertextB64, entry.payload.ivB64, wrappingKey)
  }

  async deriveSharedSecret(
    senderPrivateKeyB64: string,
    recipientPublicKeyB64: string,
  ): Promise<Uint8Array> {
    const sodium = await loadSodium()
    return sodium.crypto_scalarmult(
      fromBase64(senderPrivateKeyB64),
      fromBase64(recipientPublicKeyB64),
    )
  }
}

export const x25519WrappingAlgorithm = new X25519WrappingAlgorithm()

export const generateUserKeyPair = async () => {
  const { publicKeyB64, privateKeyB64 } = await x25519WrappingAlgorithm.generateKeyPair()
  return { publicKeyB64, privateKeyB64 }
}

export const deriveSharedSecret = (
  senderPrivateKeyB64: string,
  recipientPublicKeyB64: string,
) => x25519WrappingAlgorithm.deriveSharedSecret(senderPrivateKeyB64, recipientPublicKeyB64)

export async function wrapDekWithSealedBox(
  dek: Uint8Array,
  recipientPublicKeyB64: string,
): Promise<string> {
  const sodium = await loadSodium()
  const wrapped = sodium.crypto_box_seal(dek, fromBase64(recipientPublicKeyB64))
  return toBase64(wrapped)
}

export async function unwrapDekFromSealedBox(
  wrappedDekB64: string,
  publicKeyB64: string,
  privateKeyB64: string,
): Promise<Uint8Array> {
  const sodium = await loadSodium()
  return sodium.crypto_box_seal_open(
    fromBase64(wrappedDekB64),
    fromBase64(publicKeyB64),
    fromBase64(privateKeyB64),
  )
}
