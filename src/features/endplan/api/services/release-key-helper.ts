import {
  wrapDekForRsaPublicKey,
  wrapDekWithSealedBoxForX25519PublicKey as wrapDekForX25519PublicKey,
} from '@/shared/lib'
import { releaseApi } from '../clients/release-api'

type ReleaseKeyInfo = { publicKeyB64: string; algorithm: string }

let releaseKeyInfoCache: ReleaseKeyInfo | null = null

/**
 * Get the release service's public key and algorithm (cached).
 * Use algorithm to choose RSA vs X25519 wrap.
 */
export async function getReleaseKeyInfo(): Promise<ReleaseKeyInfo | null> {
  if (releaseKeyInfoCache) {
    return releaseKeyInfoCache
  }
  try {
    const response = await releaseApi.getPublicKey()
    releaseKeyInfoCache = { publicKeyB64: response.publicKeyB64, algorithm: response.algorithm }
    return releaseKeyInfoCache
  } catch {
    return null
  }
}

/** Wrap DEK for release service: RSA (KMS) or X25519 (mock) based on algorithm. */
export async function wrapDekForRelease(dek: Uint8Array, info: ReleaseKeyInfo): Promise<string> {
  if (info.algorithm.startsWith('RSA') || info.algorithm.includes('RSA_')) {
    return wrapDekForRsaPublicKey(dek, info.publicKeyB64)
  }
  return wrapDekForX25519PublicKey(dek, info.publicKeyB64)
}

export async function wrapDekForReleaseIfAvailable(dek: Uint8Array): Promise<string | undefined> {
  const releaseKeyInfo = await getReleaseKeyInfo()
  if (!releaseKeyInfo) {
    return undefined
  }
  return wrapDekForRelease(dek, releaseKeyInfo)
}
