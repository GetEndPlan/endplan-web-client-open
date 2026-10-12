import type { SharedVault } from '../api/clients/vault-api'

type SharedVaultDisplayNameSource = Pick<SharedVault, 'name' | 'ownerName'>

export function getSharedVaultDisplayName(
  vault: SharedVaultDisplayNameSource,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const ownerName = vault.ownerName.trim()
  if (!ownerName) {
    return vault.name
  }

  return t('sharedVault.displayName', { name: ownerName })
}
