import type { UserKeysResponse } from '../api/keys-api'

export const KEYS_STORAGE_NAME = 'endplan-keys'
const LEGACY_KEYS_PRIVATE_SESSION_KEY = 'endplan-keys-private'
const KEYS_PRIVATE_KMS_SESSION_KEY = 'endplan-keys-private-kek-v1'
const PRIVATE_KEY_RECORD_KEY = 'keys-private-b64'
const DB_NAME = 'endplan-secure-state'
const DB_VERSION = 1
const STORE_NAME = 'secure_kv'

type PersistedKeysState = {
  keys: UserKeysResponse | null
  publicKeyB64: string | null
  pqPublicKeyB64: string | null
  privateKeyB64: string | null
  pqPrivateKeyB64: string | null
}

type StorageValue = { state: PersistedKeysState; version?: number }

type EncryptedPrivateKeyRecord = {
  key: string
  version: 1
  ivB64: string
  ciphertextB64: string
  updatedAt: number
}

type PersistedPrivateKeyBundle = {
  x25519?: string | null
  mlKem768?: string | null
  classic?: string | null
  pq?: string | null
}

let dbPromise: Promise<IDBDatabase> | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function canUseWebCrypto(): boolean {
  return isBrowser() && !!window.crypto?.subtle
}

function canUseIndexedDB(): boolean {
  return isBrowser() && typeof window.indexedDB !== 'undefined'
}

function canUseLocalStorage(): boolean {
  return isBrowser() && typeof window.localStorage !== 'undefined'
}

function canUseSessionStorage(): boolean {
  return isBrowser() && typeof window.sessionStorage !== 'undefined'
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

function openDatabase(): Promise<IDBDatabase> {
  if (!canUseIndexedDB()) {
    return Promise.reject(new Error('indexeddb unavailable'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('failed to open secure db'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
  }).catch((error) => {
    dbPromise = null
    throw error
  })

  return dbPromise
}

async function idbGetRecord(key: string): Promise<EncryptedPrivateKeyRecord | null> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onerror = () => reject(request.error ?? new Error('failed to read secure record'))
    request.onsuccess = () => {
      const value = request.result as EncryptedPrivateKeyRecord | undefined
      if (!value || value.version !== 1) {
        resolve(null)
        return
      }
      resolve(value)
    }
  })
}

async function idbPutRecord(record: EncryptedPrivateKeyRecord): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record)
    request.onerror = () => reject(request.error ?? new Error('failed to write secure record'))
    request.onsuccess = () => resolve()
  })
}

async function idbDeleteRecord(key: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(key)
    request.onerror = () => reject(request.error ?? new Error('failed to delete secure record'))
    request.onsuccess = () => resolve()
  })
}

function getOrCreateSessionEncryptionKeyB64(): string {
  if (!canUseSessionStorage() || !isBrowser()) {
    throw new Error('session storage unavailable')
  }
  const existing = window.sessionStorage.getItem(KEYS_PRIVATE_KMS_SESSION_KEY)
  if (existing) return existing
  const bytes = new Uint8Array(32)
  window.crypto.getRandomValues(bytes)
  const next = bytesToB64(bytes)
  window.sessionStorage.setItem(KEYS_PRIVATE_KMS_SESSION_KEY, next)
  return next
}

async function importSessionEncryptionKey(): Promise<CryptoKey> {
  if (!canUseWebCrypto()) {
    throw new Error('webcrypto unavailable')
  }
  const keyB64 = getOrCreateSessionEncryptionKeyB64()
  const keyBytes = b64ToBytes(keyB64)
  return window.crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

async function writeEncryptedPrivateKey(privateKeyB64: string): Promise<void> {
  if (!canUseWebCrypto() || !canUseIndexedDB() || !isBrowser()) {
    throw new Error('secure storage unavailable')
  }
  const key = await importSessionEncryptionKey()
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  const plaintext = new TextEncoder().encode(privateKeyB64)
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  await idbPutRecord({
    key: PRIVATE_KEY_RECORD_KEY,
    version: 1,
    ivB64: bytesToB64(iv),
    ciphertextB64: bytesToB64(new Uint8Array(encrypted)),
    updatedAt: Date.now(),
  })
}

async function readEncryptedPrivateKey(): Promise<string | null> {
  if (!canUseWebCrypto() || !canUseIndexedDB() || !isBrowser()) return null
  const record = await idbGetRecord(PRIVATE_KEY_RECORD_KEY)
  if (!record) return null

  try {
    const key = await importSessionEncryptionKey()
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(b64ToBytes(record.ivB64)) },
      key,
      toArrayBuffer(b64ToBytes(record.ciphertextB64)),
    )
    return new TextDecoder().decode(new Uint8Array(decrypted))
  } catch {
    return null
  }
}

async function clearEncryptedPrivateKey(): Promise<void> {
  if (!canUseIndexedDB()) return
  await idbDeleteRecord(PRIVATE_KEY_RECORD_KEY)
}

function readLegacyPrivateKeyFromSession(): string | null {
  if (!canUseSessionStorage() || !isBrowser()) return null
  const raw = window.sessionStorage.getItem(LEGACY_KEYS_PRIVATE_SESSION_KEY)
  if (raw == null) return null
  try {
    return JSON.parse(raw) as string | null
  } catch {
    return null
  }
}

function writeLegacyPrivateKeyToSession(privateKeyB64: string | null): void {
  if (!canUseSessionStorage() || !isBrowser()) return
  if (privateKeyB64 == null) {
    window.sessionStorage.removeItem(LEGACY_KEYS_PRIVATE_SESSION_KEY)
    return
  }
  window.sessionStorage.setItem(LEGACY_KEYS_PRIVATE_SESSION_KEY, JSON.stringify(privateKeyB64))
}

function clearSessionEncryptionKey(): void {
  if (!canUseSessionStorage() || !isBrowser()) return
  window.sessionStorage.removeItem(KEYS_PRIVATE_KMS_SESSION_KEY)
}

/** Persist keys + publicKey to localStorage; privateKey to encrypted IndexedDB using a session-held key.
 *  Zustand persist passes/receives objects { state, version }, not strings. */
export function createKeysStorage() {
  return {
    async getItem(name: string): Promise<StorageValue | null> {
      const main = canUseLocalStorage() ? window.localStorage.getItem(name) : null
      if (!main) return null
      try {
        const parsed = JSON.parse(main) as StorageValue
        if (!parsed?.state) {
          return parsed
        }

        const privateKeyPayload = await readEncryptedPrivateKey()
        let privateKeyB64: string | null = null
        let pqPrivateKeyB64: string | null = null
        if (privateKeyPayload) {
          try {
            const parsedKeys = JSON.parse(privateKeyPayload) as PersistedPrivateKeyBundle
            privateKeyB64 = parsedKeys.x25519 ?? parsedKeys.classic ?? null
            pqPrivateKeyB64 = parsedKeys.mlKem768 ?? parsedKeys.pq ?? null
          } catch {
            privateKeyB64 = privateKeyPayload
          }
        }
        if (!privateKeyB64) {
          // One-time legacy migration path for users who still have sessionStorage plaintext key.
          const legacyPrivate = readLegacyPrivateKeyFromSession()
          if (legacyPrivate) {
            privateKeyB64 = legacyPrivate
            try {
              await writeEncryptedPrivateKey(legacyPrivate)
              writeLegacyPrivateKeyToSession(null)
            } catch {
              // Keep legacy value as fallback if secure write fails.
            }
          }
        }
        parsed.state.privateKeyB64 = privateKeyB64
        parsed.state.pqPrivateKeyB64 = pqPrivateKeyB64 ?? parsed.state.pqPrivateKeyB64 ?? null
        parsed.state.pqPublicKeyB64 = parsed.state.pqPublicKeyB64 ?? parsed.state.keys?.pqPublicKeyB64 ?? null
        return parsed
      } catch {
        return null
      }
    },
    async setItem(name: string, value: StorageValue) {
      try {
        const { state } = value
        const privateKeyB64 = state.privateKeyB64
        const pqPrivateKeyB64 = state.pqPrivateKeyB64
        const rest: Omit<PersistedKeysState, 'privateKeyB64' | 'pqPrivateKeyB64'> = {
          keys: state.keys,
          publicKeyB64: state.publicKeyB64,
          pqPublicKeyB64: state.pqPublicKeyB64,
        }
        if (canUseLocalStorage()) {
          window.localStorage.setItem(name, JSON.stringify({ state: rest, version: value.version }))
        }
        if (privateKeyB64 != null) {
          try {
            await writeEncryptedPrivateKey(JSON.stringify({
              x25519: privateKeyB64,
              mlKem768: pqPrivateKeyB64 ?? null,
            }))
            writeLegacyPrivateKeyToSession(null)
          } catch {
            // Secure storage unavailable: keep old behavior to avoid breaking unlock flows.
            writeLegacyPrivateKeyToSession(privateKeyB64)
          }
        } else {
          await clearEncryptedPrivateKey().catch(() => {})
          writeLegacyPrivateKeyToSession(null)
        }
      } catch {
        if (canUseLocalStorage()) {
          window.localStorage.setItem(name, JSON.stringify(value))
        }
      }
    },
    async removeItem(name: string) {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(name)
      }
      await clearEncryptedPrivateKey().catch(() => {})
      writeLegacyPrivateKeyToSession(null)
      clearSessionEncryptionKey()
    },
  }
}
