/**
 * Best-effort AES-GCM at-rest protection for browser storage that shares the
 * same session-scoped key used to wrap the private key in IndexedDB.
 * Same-origin XSS can still read the key from sessionStorage; clearing on
 * logout/lock is the primary confidentiality control for drafts.
 */

export const SESSION_AT_REST_KEK_STORAGE_KEY = 'endplan-keys-private-kek-v1'

export type SessionAtRestCiphertext = {
  ivB64: string
  ciphertextB64: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function canUseSessionStorage(): boolean {
  return isBrowser() && typeof window.sessionStorage !== 'undefined'
}

function canUseWebCrypto(): boolean {
  return isBrowser() && !!window.crypto?.subtle
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function getOrCreateSessionKekB64(): string {
  if (!canUseSessionStorage()) {
    throw new Error('session storage unavailable')
  }
  const existing = window.sessionStorage.getItem(SESSION_AT_REST_KEK_STORAGE_KEY)
  if (existing) return existing
  const bytes = new Uint8Array(32)
  window.crypto.getRandomValues(bytes)
  const next = bytesToB64(bytes)
  window.sessionStorage.setItem(SESSION_AT_REST_KEK_STORAGE_KEY, next)
  return next
}

async function importSessionAesKey(): Promise<CryptoKey> {
  if (!canUseWebCrypto()) {
    throw new Error('webcrypto unavailable')
  }
  const keyBytes = b64ToBytes(getOrCreateSessionKekB64())
  return window.crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

export async function encryptJsonForSessionAtRest(
  value: unknown,
): Promise<SessionAtRestCiphertext> {
  const key = await importSessionAesKey()
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  )
  return {
    ivB64: bytesToB64(iv),
    ciphertextB64: bytesToB64(new Uint8Array(encrypted)),
  }
}

export async function decryptJsonFromSessionAtRest<T>(
  payload: SessionAtRestCiphertext,
): Promise<T | null> {
  try {
    const key = await importSessionAesKey()
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(b64ToBytes(payload.ivB64)) },
      key,
      toArrayBuffer(b64ToBytes(payload.ciphertextB64)),
    )
    return JSON.parse(new TextDecoder().decode(new Uint8Array(decrypted))) as T
  } catch {
    return null
  }
}

export function clearSessionAtRestKek(): void {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(SESSION_AT_REST_KEK_STORAGE_KEY)
}
