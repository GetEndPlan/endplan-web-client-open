import type { MLKEM768 } from '@oqs/liboqs-js'
import { ML_KEM_768_ALGORITHM, isMlKem768WrappingEnabled } from '../config/algorithms'
import { cryptoEncoding, decryptPrivateKey, encryptPrivateKey, hkdfSha256 } from '../core/core'
import type { KeyWrappingAlgorithm } from './key-wrapping-algorithm'
import type { MlKemAlgorithm, MlKemWrappedDekEntry } from '../types'

type MlKemModule = typeof import('@oqs/liboqs-js')
type MlKemFactory = MlKemModule['createMLKEM768']

const { toBase64, fromBase64 } = cryptoEncoding

let mlKemSupportPromise: Promise<boolean> | null = null
let mlKemFactoryPromise: Promise<MlKemFactory> | null = null
let mlKemSupportError: Error | null = null

function toSupportError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.trim()
    if (message) {
      return new Error(message)
    }
    return error
  }

  if (typeof error === 'string' && error.trim() !== '') {
    return new Error(error.trim())
  }

  return new Error('Unknown ML-KEM-768 initialization error')
}

async function loadMlKemFactory(): Promise<MlKemFactory> {
  if (!mlKemFactoryPromise) {
    mlKemFactoryPromise = import('@oqs/liboqs-js').then((module) => module.createMLKEM768)
  }
  return mlKemFactoryPromise
}

async function withMlKem<T>(operation: (kem: MLKEM768) => T | Promise<T>): Promise<T> {
  const createMLKEM768 = await loadMlKemFactory()
  const kem = await createMLKEM768()

  try {
    return await operation(kem)
  } finally {
    kem.destroy()
  }
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

export class MlKem768WrappingAlgorithm implements KeyWrappingAlgorithm<'ML-KEM-768', MlKemWrappedDekEntry> {
  readonly algorithm: MlKemAlgorithm = ML_KEM_768_ALGORITHM

  isEnabled(): boolean {
    return isMlKem768WrappingEnabled()
  }

  async isSupported(): Promise<boolean> {
    if (!mlKemSupportPromise) {
      mlKemSupportPromise = (async () => {
        try {
          await withMlKem(() => true)
          mlKemSupportError = null
          return true
        } catch (error) {
          mlKemSupportError = toSupportError(error)
          return false
        }
      })()
    }
    return mlKemSupportPromise
  }

  async generateKeyPair() {
    return withMlKem((kem) => {
      const { publicKey, secretKey } = kem.generateKeyPair()
      return {
        publicKeyB64: toBase64(publicKey),
        privateKeyB64: toBase64(secretKey),
        algorithm: this.algorithm,
      }
    })
  }

  async wrapDek(dek: Uint8Array, recipientPublicKeyB64: string): Promise<MlKemWrappedDekEntry> {
    return withMlKem(async (kem) => {
      const { ciphertext, sharedSecret } = kem.encapsulate(fromBase64(recipientPublicKeyB64))
      const wrappingKey = await hkdfSha256(sharedSecret, 'dek-wrapping-ml-kem-768')
      const wrapped = await encryptWrappedDek(dek, wrappingKey)

      return {
        algorithm: this.algorithm,
        payload: {
          pqCiphertextB64: toBase64(ciphertext),
          ciphertextB64: wrapped.ciphertextB64,
          ivB64: wrapped.ivB64,
        },
      }
    })
  }

  async unwrapDek(entry: MlKemWrappedDekEntry, privateKeyB64: string): Promise<Uint8Array> {
    return withMlKem(async (kem) => {
      const sharedSecret = kem.decapsulate(
        fromBase64(entry.payload.pqCiphertextB64),
        fromBase64(privateKeyB64),
      )
      const wrappingKey = await hkdfSha256(sharedSecret, 'dek-wrapping-ml-kem-768')
      return decryptWrappedDek(entry.payload.ciphertextB64, entry.payload.ivB64, wrappingKey)
    })
  }
}

export const mlKem768WrappingAlgorithm = new MlKem768WrappingAlgorithm()

export async function isMlKemSupported(): Promise<boolean> {
  return mlKem768WrappingAlgorithm.isSupported()
}

export function getMlKemSupportError(): Error | null {
  return mlKemSupportError
}

export async function generateMlKemKeyPair(): Promise<{
  publicKeyB64: string
  privateKeyB64: string
  pqKeyAlgorithm: MlKemAlgorithm
}> {
  const { publicKeyB64, privateKeyB64, algorithm } = await mlKem768WrappingAlgorithm.generateKeyPair()
  return {
    publicKeyB64,
    privateKeyB64,
    pqKeyAlgorithm: algorithm,
  }
}

export async function encapsulateMlKemSecret(
  recipientPublicKeyB64: string,
): Promise<{ pqCiphertextB64: string; sharedSecret: Uint8Array }> {
  return withMlKem((kem) => {
    const { ciphertext, sharedSecret } = kem.encapsulate(fromBase64(recipientPublicKeyB64))
    return {
      pqCiphertextB64: toBase64(ciphertext),
      sharedSecret: new Uint8Array(sharedSecret),
    }
  })
}

export async function decapsulateMlKemSecret(
  ciphertextB64: string,
  privateKeyB64: string,
): Promise<Uint8Array> {
  return withMlKem((kem) => {
    const sharedSecret = kem.decapsulate(fromBase64(ciphertextB64), fromBase64(privateKeyB64))
    return new Uint8Array(sharedSecret)
  })
}
