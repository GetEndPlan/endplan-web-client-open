import { accessApi } from '@/features/trusted-circle/api/clients/access-api'
import { getWrappedDekMetadata, unwrapDekWithKeyPair, wrapDekForPublicKey, HYBRID_KEM_WRAPPING_VERSION, CLASSIC_WRAPPING_VERSION } from '@/shared/lib'
import { vaultApi, type SharedVault } from '../clients/vault-api'

type SelfRewrapParams = {
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPublicKeyB64?: string | null
  actorPqPrivateKeyB64?: string | null
}

type SelfRewrapResult = {
  checkedVaults: number
  rewrappedVaults: number
  failedVaults: Array<{ vaultId: string; reason: string }>
}

function needsSelfRewrap(
  wrappedDek: string,
  hasPqPublicKey: boolean,
): boolean {
  const metadata = getWrappedDekMetadata(wrappedDek)
  const desiredVersion = hasPqPublicKey ? HYBRID_KEM_WRAPPING_VERSION : CLASSIC_WRAPPING_VERSION
  return metadata.wrappingVersion < desiredVersion
}

export async function rewrapOwnDeksAfterKeyUpgrade(
  params: SelfRewrapParams,
): Promise<SelfRewrapResult> {
  const {
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPublicKeyB64,
    actorPqPrivateKeyB64,
  } = params

  const hasPq = !!actorPqPublicKeyB64

  const sharedVaultsResponse = await vaultApi.listShared()
  const sharedVaults: SharedVault[] = Array.isArray(sharedVaultsResponse.vaults)
    ? sharedVaultsResponse.vaults
    : []

  const vaultsToRewrap = sharedVaults.filter(
    (v) => v.wrappedDek && needsSelfRewrap(v.wrappedDek, hasPq),
  )

  if (vaultsToRewrap.length === 0) {
    return { checkedVaults: sharedVaults.length, rewrappedVaults: 0, failedVaults: [] }
  }

  const failedVaults: Array<{ vaultId: string; reason: string }> = []
  let rewrappedVaults = 0

  for (const vault of vaultsToRewrap) {
    try {
      const dek = await unwrapDekWithKeyPair(
        vault.wrappedDek,
        actorPublicKeyB64,
        actorPrivateKeyB64,
        actorPqPrivateKeyB64,
        { vaultId: vault.id },
      )
      const wrappedDek = await wrapDekForPublicKey(
        dek,
        actorPublicKeyB64,
        actorPqPublicKeyB64,
        {
          vaultId: vault.id,
          requireHybrid: hasPq,
        },
      )
      await accessApi.rewrapOwnWrappedDEK(vault.id, { wrappedDek })
      rewrappedVaults += 1
    } catch (error) {
      failedVaults.push({
        vaultId: vault.id,
        reason: error instanceof Error ? error.message : 'Failed to rewrap own DEK',
      })
    }
  }

  return {
    checkedVaults: sharedVaults.length,
    rewrappedVaults,
    failedVaults,
  }
}
