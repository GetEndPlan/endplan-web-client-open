import type { EndPlanData } from '../../services/endplan-service'
import { useDecryptedVaultData } from '../decryption/use-decrypted-vault-data'
import type { SharedVault, VaultResponse } from '../../clients/vault-api'
import { vaultKeys } from '../../keys/vault-query-keys'

type UseSharedVaultViewParams = {
  sharedVault: SharedVault | null
  vault: VaultResponse | null | undefined
  publicKeyB64: string | null
  privateKeyB64: string | null
  pqPrivateKeyB64?: string | null
}

type SharedVaultViewState = {
  sharedVaultData: EndPlanData | null
  sharedVaultOwnerId: string | null
  isLoading: boolean
  error: string | null
}

export function useSharedVaultView(params: UseSharedVaultViewParams): SharedVaultViewState {
  const { sharedVault, vault, publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = params
  const hasDecryptInputs = !!sharedVault && !!vault && !!publicKeyB64 && !!privateKeyB64

  const decryptedQuery = useDecryptedVaultData({
    vault: hasDecryptInputs ? vault : null,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    queryKey: vaultKeys.sharedDecrypted(vault?.id ?? '', vault?.updatedAt ?? ''),
    enabled: hasDecryptInputs,
  })

  const sharedVaultData = hasDecryptInputs ? decryptedQuery.data : null
  const sharedVaultOwnerId = sharedVaultData && vault ? vault.ownerId : null

  const rawError = hasDecryptInputs ? decryptedQuery.error : null
  const error =
    rawError instanceof Error
      ? rawError.message
      : rawError
        ? 'Failed to decrypt shared vault'
        : null

  return {
    sharedVaultData,
    sharedVaultOwnerId,
    isLoading: hasDecryptInputs ? decryptedQuery.isLoading : false,
    error,
  }
}
