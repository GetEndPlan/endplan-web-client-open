import type { QueryClient } from '@tanstack/react-query'
import {
  ensureOwnedVaultIfMissing,
  persistRecoveryPhraseToVault,
  vaultApi,
  vaultKeys,
} from '@/features/endplan'
import { keysKeys } from '../api/hooks/keys-hooks'
import { useKeysStore } from '../model/keys-store'

/**
 * After Start fresh or when the account has no server keys, generate keys with the
 * sign-in password and ensure an empty owned EndPlan vault exists (same as login bootstrap).
 */
export async function bootstrapCryptoSessionAfterKeySetup(params: {
  queryClient: QueryClient
  userId: string
  password: string
}): Promise<void> {
  const { queryClient, userId, password } = params

  const bootstrap = await useKeysStore.getState().ensureKeys(password)
  await queryClient.invalidateQueries({ queryKey: keysKeys.all })

  const { publicKeyB64, privateKeyB64, pqPublicKeyB64, pqPrivateKeyB64 } = useKeysStore.getState()
  if (!publicKeyB64 || !privateKeyB64) {
    throw new Error('Encryption keys could not be prepared')
  }

  await ensureOwnedVaultIfMissing({
    ownerId: userId,
    publicKeyB64,
    pqPublicKeyB64,
  })
  clearVaultQueryCache(queryClient)
  await prefetchOwnedVaultList(queryClient)

  if (bootstrap.recoveryMnemonicForVault) {
    try {
      await persistRecoveryPhraseToVault({
        ownerId: userId,
        publicKeyB64,
        privateKeyB64,
        pqPublicKeyB64,
        pqPrivateKeyB64,
        mnemonic: bootstrap.recoveryMnemonicForVault,
      })
      clearVaultQueryCache(queryClient)
      await prefetchOwnedVaultList(queryClient)
    } catch {
      // Non-fatal; Settings recovery flow can repair.
    }
  }
}

async function prefetchOwnedVaultList(queryClient: QueryClient): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: vaultKeys.owned(),
    queryFn: () => vaultApi.listOwned(),
  })
}

/** Drop stale vault / documents-tree cache (e.g. after Start fresh or new vault bootstrap). */
export function clearVaultQueryCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: vaultKeys.all })
}

/**
 * Clear cached key/vault queries after server-side crypto wipe (Start fresh).
 */
export function invalidateCryptoSessionQueries(queryClient: QueryClient): void {
  queryClient.setQueryData(keysKeys.mine(), null)
  queryClient.removeQueries({ queryKey: keysKeys.all })
  clearVaultQueryCache(queryClient)
}
