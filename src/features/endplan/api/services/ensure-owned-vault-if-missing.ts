import { vaultApi } from '../clients/vault-api'
import { createInitialVault } from './endplan-service'

let inFlight: Promise<boolean> | null = null

/**
 * If the authenticated user has no owned vault, creates an empty EndPlan vault
 * (same as signup). Idempotent and safe to call after login / unlock.
 *
 * @returns true when a vault was created
 */
export async function ensureOwnedVaultIfMissing(params: {
  ownerId: string
  publicKeyB64: string | null
  pqPublicKeyB64?: string | null
}): Promise<boolean> {
  const { ownerId, publicKeyB64, pqPublicKeyB64 } = params
  if (!publicKeyB64 || !ownerId) {
    return false
  }

  if (!inFlight) {
    inFlight = (async (): Promise<boolean> => {
      const { vaults } = await vaultApi.listOwned()
      if (vaults.length > 0) {
        return false
      }
      await createInitialVault(publicKeyB64, ownerId, pqPublicKeyB64 ?? null)
      return true
    })().finally(() => {
      inFlight = null
    })
  }

  return inFlight
}
