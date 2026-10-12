import {
  decryptJsonFromSessionAtRest,
  encryptJsonForSessionAtRest,
} from '@/shared/lib/session-at-rest'
import type { AssetSectionPayloadV2 } from './asset-table-model'

export type PendingPoliciesAutosaveSnapshot = {
  vaultId: string
  payload: AssetSectionPayloadV2
  selectedCategoryIds: string[]
  payloadHash: string
  lastPersistedPayloadHash: string | null
  updatedAt: number
}

type EncryptedPendingAssetsAutosaveRecord = {
  vaultId: string
  storageVersion: 2
  ivB64: string
  ciphertextB64: string
  updatedAt: number
}

const DB_NAME = 'endplan_policies_autosave'
const DB_VERSION = 1
const STORE_NAME = 'pending_policies_snapshots'
const STORAGE_KEY_PREFIX = 'endplan:policies:pending:'

let dbPromise: Promise<IDBDatabase> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isSnapshot(value: unknown): value is PendingPoliciesAutosaveSnapshot {
  if (!isRecord(value)) return false
  if (typeof value.vaultId !== 'string') return false
  if (!isRecord(value.payload)) return false
  if (!Array.isArray(value.selectedCategoryIds)) return false
  if (!value.selectedCategoryIds.every((id) => typeof id === 'string')) return false
  if (typeof value.payloadHash !== 'string') return false
  if (
    value.lastPersistedPayloadHash !== null &&
    typeof value.lastPersistedPayloadHash !== 'string'
  ) {
    return false
  }
  if (typeof value.updatedAt !== 'number') return false
  return true
}

function isEncryptedRecord(value: unknown): value is EncryptedPendingAssetsAutosaveRecord {
  if (!isRecord(value)) return false
  return (
    typeof value.vaultId === 'string' &&
    value.storageVersion === 2 &&
    typeof value.ivB64 === 'string' &&
    typeof value.ciphertextB64 === 'string' &&
    typeof value.updatedAt === 'number'
  )
}

function localStorageKey(vaultId: string): string {
  return `${STORAGE_KEY_PREFIX}${vaultId}`
}

function canUseIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function openDatabase(): Promise<IDBDatabase> {
  if (!canUseIndexedDB()) {
    return Promise.reject(new Error('indexeddb unavailable'))
  }
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error('failed to open indexeddb'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'vaultId' })
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

async function idbGetRaw(vaultId: string): Promise<unknown> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(vaultId)
    request.onerror = () => reject(request.error ?? new Error('failed to read snapshot'))
    request.onsuccess = () => resolve(request.result ?? null)
  })
}

async function idbPutRaw(record: EncryptedPendingAssetsAutosaveRecord): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(record)
    request.onerror = () => reject(request.error ?? new Error('failed to write snapshot'))
    request.onsuccess = () => resolve()
  })
}

async function idbDelete(vaultId: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(vaultId)
    request.onerror = () => reject(request.error ?? new Error('failed to delete snapshot'))
    request.onsuccess = () => resolve()
  })
}

async function idbClearAll(): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()
    request.onerror = () => reject(request.error ?? new Error('failed to clear snapshots'))
    request.onsuccess = () => resolve()
  })
}

async function decodeStoredValue(value: unknown): Promise<PendingPoliciesAutosaveSnapshot | null> {
  if (isEncryptedRecord(value)) {
    return decryptJsonFromSessionAtRest<PendingPoliciesAutosaveSnapshot>({
      ivB64: value.ivB64,
      ciphertextB64: value.ciphertextB64,
    })
  }
  // Legacy plaintext drafts: accept once so in-flight edits are not lost, then migrate on next save.
  return isSnapshot(value) ? value : null
}

async function encodeSnapshot(
  snapshot: PendingPoliciesAutosaveSnapshot,
): Promise<EncryptedPendingAssetsAutosaveRecord> {
  const encrypted = await encryptJsonForSessionAtRest(snapshot)
  return {
    vaultId: snapshot.vaultId,
    storageVersion: 2,
    ivB64: encrypted.ivB64,
    ciphertextB64: encrypted.ciphertextB64,
    updatedAt: snapshot.updatedAt,
  }
}

function localStorageGetRaw(vaultId: string): unknown {
  if (!canUseLocalStorage()) return null
  const raw = window.localStorage.getItem(localStorageKey(vaultId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function localStoragePutRaw(vaultId: string, value: EncryptedPendingAssetsAutosaveRecord): void {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(localStorageKey(vaultId), JSON.stringify(value))
}

function localStorageDelete(vaultId: string): void {
  if (!canUseLocalStorage()) return
  window.localStorage.removeItem(localStorageKey(vaultId))
}

function localStorageClearAllPending(): void {
  if (!canUseLocalStorage()) return
  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  for (const key of keysToRemove) {
    window.localStorage.removeItem(key)
  }
}

export async function loadPendingPoliciesAutosaveSnapshot(
  vaultId: string,
): Promise<PendingPoliciesAutosaveSnapshot | null> {
  if (!vaultId) return null

  try {
    if (canUseIndexedDB()) {
      const snapshot = await decodeStoredValue(await idbGetRaw(vaultId))
      if (snapshot) {
        return snapshot
      }
    }
  } catch {
    // Fall back to localStorage
  }

  return decodeStoredValue(localStorageGetRaw(vaultId))
}

export async function savePendingPoliciesAutosaveSnapshot(
  snapshot: PendingPoliciesAutosaveSnapshot,
): Promise<void> {
  if (!snapshot.vaultId) return

  const encrypted = await encodeSnapshot(snapshot)

  if (canUseIndexedDB()) {
    try {
      await idbPutRaw(encrypted)
      // Avoid mirroring a second full JSON copy in localStorage (quota + memory pressure).
      localStorageDelete(snapshot.vaultId)
      return
    } catch {
      // Fall through to localStorage only when IndexedDB is unavailable or write failed.
    }
  }

  localStoragePutRaw(snapshot.vaultId, encrypted)
}

export async function clearPendingPoliciesAutosaveSnapshot(vaultId: string): Promise<void> {
  if (!vaultId) return

  try {
    if (canUseIndexedDB()) {
      await idbDelete(vaultId)
    }
  } catch {
    // Fall back to localStorage
  }

  localStorageDelete(vaultId)
}

/** Wipe all pending asset drafts (logout / key lock). */
export async function clearAllPendingPoliciesAutosaveSnapshots(): Promise<void> {
  try {
    if (canUseIndexedDB()) {
      await idbClearAll()
    }
  } catch {
    // Continue with localStorage cleanup
  }
  localStorageClearAllPending()
}
