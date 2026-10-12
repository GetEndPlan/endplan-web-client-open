import { keysApi, type PublicKeyResponse } from '@/features/keys'
import { accessApi, type RotateVaultWrappedDEKItem, type VaultAccessEntry } from '@/features/trusted-circle/api/clients/access-api'
import {
  CLASSIC_WRAPPING_VERSION,
  HYBRID_KEM_WRAPPING_VERSION,
  getWrappedDekMetadata,
  recipientExpectsHybridWrap,
  unwrapDekWithKeyPair,
  wrapDekForPublicKey,
} from '@/shared/lib'
import { vaultApi } from '../clients/vault-api'

type MigrateOwnedVaultWrappedDeksParams = {
  actorUserId: string
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPublicKeyB64?: string | null
  actorPqPrivateKeyB64?: string | null
}

type MigrateOwnedVaultWrappedDeksResult = {
  checkedVaults: number
  migratedVaults: number
  failedVaults: Array<{ vaultId: string; reason: string }>
  pendingMemberUpgrades: Array<{ vaultId: string; userId: string; currentVersion: number; desiredVersion: number }>
}

function desiredWrappingVersion(bundle: Pick<PublicKeyResponse, 'pqPublicKeyB64'>): number {
  return bundle.pqPublicKeyB64 ? HYBRID_KEM_WRAPPING_VERSION : CLASSIC_WRAPPING_VERSION
}

function needsWrappedDekMigration(
  access: Pick<VaultAccessEntry, 'wrappedDek'>,
  bundle: Pick<PublicKeyResponse, 'pqPublicKeyB64'>,
): boolean {
  const metadata = getWrappedDekMetadata(access.wrappedDek)
  return metadata.wrappingVersion !== desiredWrappingVersion(bundle)
}

async function listPublicKeyBundlesByUserId(
  userIds: string[],
): Promise<Map<string, PublicKeyResponse>> {
  const uniqueUserIds = [...new Set(userIds.filter((userId) => userId.trim() !== ''))]
  if (uniqueUserIds.length === 0) {
    return new Map()
  }

  const { keys } = await keysApi.listPublicKeys({ userIds: uniqueUserIds })
  return new Map(keys.map((bundle) => [bundle.userId, bundle]))
}

async function buildRotatedWrappedDekItems(params: {
  vaultId: string
  actorUserId: string
  actorPublicKeyB64: string
  actorPqPublicKeyB64?: string | null
  dek: Uint8Array
  activeAccessEntries: VaultAccessEntry[]
  publicKeysByUserId: Map<string, PublicKeyResponse>
}): Promise<RotateVaultWrappedDEKItem[]> {
  const {
    vaultId,
    actorUserId,
    actorPublicKeyB64,
    actorPqPublicKeyB64,
    dek,
    activeAccessEntries,
    publicKeysByUserId,
  } = params

  const items: RotateVaultWrappedDEKItem[] = []
  for (const access of activeAccessEntries) {
    const keyBundle = access.userId === actorUserId
      ? {
          userId: actorUserId,
          publicKeyB64: actorPublicKeyB64,
          pqPublicKeyB64: actorPqPublicKeyB64 ?? null,
          keyBundleVersion: actorPqPublicKeyB64 ? 2 : 1,
        }
      : publicKeysByUserId.get(access.userId)
    if (!keyBundle?.publicKeyB64) {
      throw new Error(`Missing public key bundle for active user ${access.userId}`)
    }

    const wrappedDek = await wrapDekForPublicKey(
      dek,
      keyBundle.publicKeyB64,
      keyBundle.pqPublicKeyB64,
      {
        vaultId,
        requireHybrid: recipientExpectsHybridWrap(keyBundle),
      },
    )
    items.push({
      userId: access.userId,
      wrappedDek,
    })
  }

  return items
}

/**
 * Rewraps access envelopes to the desired wrapping version while keeping the same DEK.
 * TODO(security): historically captured v1/v2 wraps remain useful against that DEK until a full
 * DEK rotation (re-encrypt vault/sections/documents) runs — see rotate-vault-dek-service.
 */
export async function migrateOwnedVaultWrappedDeksIfNeeded(
  params: MigrateOwnedVaultWrappedDeksParams,
): Promise<MigrateOwnedVaultWrappedDeksResult> {
  const {
    actorUserId,
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPublicKeyB64,
    actorPqPrivateKeyB64,
  } = params

  const ownedVaultsResponse = await vaultApi.listOwned()
  const ownedVaults = Array.isArray(ownedVaultsResponse.vaults) ? ownedVaultsResponse.vaults : []
  if (ownedVaults.length === 0) {
    return {
      checkedVaults: 0,
      migratedVaults: 0,
      failedVaults: [],
      pendingMemberUpgrades: [],
    }
  }

  const accessResults = await Promise.allSettled(
    ownedVaults.map(async (vault) => ({
      vaultId: vault.id,
      access: (await accessApi.listVaultAccess(vault.id)).access,
    })),
  )

  const failedVaults: Array<{ vaultId: string; reason: string }> = []
  const accessibleVaults = accessResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return [result.value]
    }
    failedVaults.push({
      vaultId: ownedVaults[index]?.id ?? 'unknown',
      reason: result.reason instanceof Error ? result.reason.message : 'Failed to list vault access',
    })
    return []
  })

  const activeUserIds = [...new Set(
    accessibleVaults.flatMap((vault) => vault.access.filter((entry) => entry.isActive).map((entry) => entry.userId)),
  )]
  const publicKeysByUserId = await listPublicKeyBundlesByUserId(activeUserIds)
  publicKeysByUserId.set(actorUserId, {
    userId: actorUserId,
    publicKeyB64: actorPublicKeyB64,
    pqPublicKeyB64: actorPqPublicKeyB64 ?? null,
  })

  let migratedVaults = 0
  const pendingMemberUpgrades: MigrateOwnedVaultWrappedDeksResult['pendingMemberUpgrades'] = []

  for (const vault of accessibleVaults) {
    try {
      const activeAccessEntries = vault.access.filter((entry) => entry.isActive)
      if (activeAccessEntries.length === 0) {
        continue
      }

      const ownerAccess = activeAccessEntries.find((entry) => entry.userId === actorUserId)
      if (!ownerAccess) {
        throw new Error('Owner access row not found for wrapped DEK migration')
      }

      const missingKeyUser = activeAccessEntries.find((entry) => !publicKeysByUserId.get(entry.userId)?.publicKeyB64)
      if (missingKeyUser) {
        throw new Error(`Missing public key bundle for ${missingKeyUser.userId}`)
      }

      for (const entry of activeAccessEntries) {
        const bundle = publicKeysByUserId.get(entry.userId)
        if (!bundle) continue
        const currentMeta = getWrappedDekMetadata(entry.wrappedDek)
        const desired = desiredWrappingVersion(bundle)
        if (currentMeta.wrappingVersion < desired) {
          continue
        }
        if (!bundle.pqPublicKeyB64 && actorPqPublicKeyB64 && entry.userId !== actorUserId) {
          pendingMemberUpgrades.push({
            vaultId: vault.vaultId,
            userId: entry.userId,
            currentVersion: currentMeta.wrappingVersion,
            desiredVersion: HYBRID_KEM_WRAPPING_VERSION,
          })
        }
      }

      const migrationNeeded = activeAccessEntries.some((entry) =>
        needsWrappedDekMigration(entry, publicKeysByUserId.get(entry.userId)!),
      )
      if (!migrationNeeded) {
        continue
      }

      const dek = await unwrapDekWithKeyPair(
        ownerAccess.wrappedDek,
        actorPublicKeyB64,
        actorPrivateKeyB64,
        actorPqPrivateKeyB64,
        { vaultId: vault.vaultId },
      )
      const items = await buildRotatedWrappedDekItems({
        vaultId: vault.vaultId,
        actorUserId,
        actorPublicKeyB64,
        actorPqPublicKeyB64,
        dek,
        activeAccessEntries,
        publicKeysByUserId,
      })

      await accessApi.rotateVaultWrappedDEKs(vault.vaultId, { items })
      migratedVaults += 1
    } catch (error) {
      failedVaults.push({
        vaultId: vault.vaultId,
        reason: error instanceof Error ? error.message : 'Failed to migrate wrapped DEKs',
      })
    }
  }

  return {
    checkedVaults: accessibleVaults.length,
    migratedVaults,
    failedVaults,
    pendingMemberUpgrades,
  }
}
