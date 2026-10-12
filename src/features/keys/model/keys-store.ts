import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { keysApi, type UserKeysResponse } from '../api/keys-api'
import { ensureUserHasKeys, generateAndSaveKeys, unlockPrivateKey } from '../api/keys-service'
import { createKeysStorage, KEYS_STORAGE_NAME } from './keys-storage'

type KeysState = {
  // Stored keys metadata (from API)
  keys: UserKeysResponse | null
  // Decrypted private key (only in memory, never persisted)
  privateKeyB64: string | null
  pqPrivateKeyB64: string | null
  // Public key for quick access
  publicKeyB64: string | null
  pqPublicKeyB64: string | null
  // Loading states
  isLoading: boolean
  isUnlocking: boolean
  error: string | null
}

export type KeyBootstrapVaultHint = {
  recoveryMnemonicForVault?: string
}

type KeysActions = {
  /**
   * Generate and save new keys (for signup)
   */
  generateKeys: (password: string) => Promise<KeyBootstrapVaultHint>
  /**
   * Ensure user has keys, generate if not (for login)
   */
  ensureKeys: (password: string) => Promise<KeyBootstrapVaultHint>
  /**
   * Unlock private key with password (for encryption operations)
   */
  unlockKeys: (password: string) => Promise<void>
  /**
   * Lock keys (clear decrypted private key from memory)
   */
  lockKeys: () => void
  /**
   * Clear all keys (on logout)
   */
  clearKeys: () => void
}

type KeysStore = KeysState & KeysActions

const initialState: KeysState = {
  keys: null,
  privateKeyB64: null,
  pqPrivateKeyB64: null,
  publicKeyB64: null,
  pqPublicKeyB64: null,
  isLoading: false,
  isUnlocking: false,
  error: null,
}

async function resolveKeysMetadata(get: () => KeysStore, set: (partial: Partial<KeysStore>) => void) {
  const currentKeys = get().keys
  if (currentKeys) return currentKeys

  const fetchedKeys = await keysApi.getMyKeys()
  if (fetchedKeys) {
    set({
      keys: fetchedKeys,
      publicKeyB64: fetchedKeys.publicKeyB64,
      pqPublicKeyB64: fetchedKeys.pqPublicKeyB64 ?? null,
    })
  }
  return fetchedKeys
}

export const useKeysStore = create<KeysStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      generateKeys: async (password) => {
        set({ isLoading: true, error: null })
        try {
          const { keys, privateKeyB64, pqPrivateKeyB64, recoveryMnemonicForVault } =
            await generateAndSaveKeys(password)
          set({
            keys,
            publicKeyB64: keys.publicKeyB64,
            pqPublicKeyB64: keys.pqPublicKeyB64 ?? null,
            privateKeyB64,
            pqPrivateKeyB64,
            isLoading: false,
          })
          return { recoveryMnemonicForVault }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to generate keys'
          set({ isLoading: false, error: message })
          throw error
        }
      },

      ensureKeys: async (password) => {
        set({ isLoading: true, error: null })

        try {
          const { keys, privateKeyB64, pqPrivateKeyB64, recoveryMnemonicForVault } =
            await ensureUserHasKeys(password)
          set({
            keys,
            publicKeyB64: keys.publicKeyB64,
            pqPublicKeyB64: keys.pqPublicKeyB64 ?? null,
            privateKeyB64,
            pqPrivateKeyB64,
            isLoading: false,
          })
          return { recoveryMnemonicForVault }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to ensure keys'
          set({ isLoading: false, isUnlocking: false, error: message })
          throw error
        }
      },

      unlockKeys: async (password) => {
        const keys = await resolveKeysMetadata(get, set)
        if (!keys) {
          throw new Error('No keys available to unlock')
        }

        set({ isUnlocking: true, error: null })
        try {
          const { privateKeyB64, pqPrivateKeyB64 } = await unlockPrivateKey(keys, password)
          set({
            privateKeyB64,
            pqPrivateKeyB64,
            isUnlocking: false,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to unlock keys'
          set({ isUnlocking: false, error: message })
          throw error
        }
      },

      lockKeys: () => {
        set({ privateKeyB64: null, pqPrivateKeyB64: null })
      },

      clearKeys: () => {
        set(initialState)
      },
    }),
    {
      name: KEYS_STORAGE_NAME,
      storage: createKeysStorage(),
      // Persist keys + publicKey to localStorage; privateKey goes to encrypted IndexedDB via custom storage.
      partialize: (state) => ({
        keys: state.keys,
        publicKeyB64: state.publicKeyB64,
        pqPublicKeyB64: state.pqPublicKeyB64,
        privateKeyB64: state.privateKeyB64,
        pqPrivateKeyB64: state.pqPrivateKeyB64,
      }),
    }
  )
)

// Selectors used by runtime key-material hooks
export const selectPublicKey = (state: KeysStore) => state.publicKeyB64
export const selectPrivateKey = (state: KeysStore) => state.privateKeyB64
export const selectPqPublicKey = (state: KeysStore) => state.pqPublicKeyB64
export const selectPqPrivateKey = (state: KeysStore) => state.pqPrivateKeyB64
