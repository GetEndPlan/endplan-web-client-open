import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'

import {
  clearAllPendingAssetsAutosaveSnapshots,
  clearPendingAssetsAutosaveSnapshot,
  loadPendingAssetsAutosaveSnapshot,
  savePendingAssetsAutosaveSnapshot,
  type PendingAssetsAutosaveSnapshot,
} from '../assets-autosave-queue.ts'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  key: (index: number) => string | null
  length: number
}

type WindowLike = {
  indexedDB?: unknown
  crypto?: Crypto
  localStorage?: StorageLike
  sessionStorage?: StorageLike
}

function installWindow(windowValue: WindowLike) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    value: windowValue,
    configurable: true,
    writable: true,
  })

  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, 'window', descriptor)
      return
    }
    delete (globalThis as { window?: unknown }).window
  }
}

function createFakeStorage(): StorageLike & { dump: () => Map<string, string> } {
  const store = new Map<string, string>()

  return {
    getItem(key: string) {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    get length() {
      return store.size
    },
    dump() {
      return new Map(store)
    },
  }
}

const snapshot: PendingAssetsAutosaveSnapshot = {
  vaultId: 'vault-1',
  payload: {
    schemaVersion: 2,
    categories: [{ categoryTemplateId: 'bank', rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }] }],
  },
  selectedCategoryIds: ['bank'],
  payloadHash: 'hash-1',
  lastPersistedPayloadHash: 'hash-0',
  updatedAt: 1_742_720_000,
}

test('assets autosave queue encrypts snapshots in localStorage fallback', async () => {
  const localStorage = createFakeStorage()
  const sessionStorage = createFakeStorage()
  const restoreWindow = installWindow({
    localStorage,
    sessionStorage,
    crypto: webcrypto as Crypto,
  })

  try {
    await savePendingAssetsAutosaveSnapshot(snapshot)
    assert.equal(localStorage.dump().size, 1)
    const raw = [...localStorage.dump().values()][0]
    assert.ok(raw)
    assert.equal(raw.includes('Checking'), false)
    assert.ok(raw.includes('"storageVersion":2'))

    const loaded = await loadPendingAssetsAutosaveSnapshot(snapshot.vaultId)
    assert.deepEqual(loaded, snapshot)

    await clearPendingAssetsAutosaveSnapshot(snapshot.vaultId)
    const afterClear = await loadPendingAssetsAutosaveSnapshot(snapshot.vaultId)
    assert.equal(afterClear, null)
  } finally {
    restoreWindow()
  }
})

test('clearAllPendingAssetsAutosaveSnapshots removes every pending draft key', async () => {
  const localStorage = createFakeStorage()
  const sessionStorage = createFakeStorage()
  const restoreWindow = installWindow({
    localStorage,
    sessionStorage,
    crypto: webcrypto as Crypto,
  })

  try {
    await savePendingAssetsAutosaveSnapshot(snapshot)
    await savePendingAssetsAutosaveSnapshot({ ...snapshot, vaultId: 'vault-2' })
    assert.equal(localStorage.dump().size, 2)

    await clearAllPendingAssetsAutosaveSnapshots()
    assert.equal(localStorage.dump().size, 0)
  } finally {
    restoreWindow()
  }
})
