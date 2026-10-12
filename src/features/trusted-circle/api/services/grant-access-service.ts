import { accessApi, type PendingAccessMember } from '../clients/access-api'
import { vaultApi, type SharedVault, type VaultResponse } from '@/features/endplan'
import { recipientExpectsHybridWrap, unwrapDekWithKeyPair, wrapDekForPublicKey } from '@/shared/lib'

type AccessibleVault = Pick<VaultResponse, 'id' | 'wrappedDek'> | Pick<SharedVault, 'id' | 'wrappedDek'>

/**
 * Get the access level based on role
 */
function getAccessLevelForRole(role: PendingAccessMember['role']): 'full' | 'partial' | 'read_only' {
  switch (role) {
    case 'key_person':
      return 'full'
    case 'recipient':
      return 'partial'
    case 'advisor':
      return 'read_only'
    default:
      return 'read_only'
  }
}

/**
 * Grant vault access to all pending trusted circle members
 * 
 * This function:
 * 1. Fetches members who accepted invitation but don't have vault access
 * 2. For each member:
 *    - Unwraps the owner's DEK using owner's private key
 *    - Re-wraps the DEK using member's public key
 *    - Calls API to grant vault access with the wrapped DEK
 */
export async function grantAccessToPendingMembers(params: {
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPrivateKeyB64?: string | null
  vault?: VaultResponse
  sharedVaults?: SharedVault[]
}): Promise<{ granted: number; errors: string[] }> {
  const {
    actorPublicKeyB64,
    actorPrivateKeyB64,
    actorPqPrivateKeyB64,
    vault: vaultParam,
    sharedVaults = [],
  } = params
  const errors: string[] = []
  let granted = 0

  try {
    const { members } = await accessApi.listPendingAccess()

    if (members.length === 0) {
      return { granted: 0, errors: [] }
    }

    const vaultCache = new Map<string, AccessibleVault>()
    const dekCache = new Map<string, Uint8Array>()
    if (vaultParam) {
      vaultCache.set(vaultParam.id, vaultParam)
    }
    for (const sharedVault of sharedVaults) {
      vaultCache.set(sharedVault.id, sharedVault)
    }

    let missingVaultIds = [...new Set(members.map((member) => member.vaultId))].filter(
      (vaultId) => !vaultCache.has(vaultId),
    )

    if (missingVaultIds.length > 0) {
      const sharedVaultList = await vaultApi.listShared().catch(() => null)
      for (const sharedVault of sharedVaultList?.vaults ?? []) {
        vaultCache.set(sharedVault.id, sharedVault)
      }
    }

    missingVaultIds = [...new Set(members.map((member) => member.vaultId))].filter(
      (vaultId) => !vaultCache.has(vaultId),
    )

    if (missingVaultIds.length > 0) {
      const missingVaults = await Promise.allSettled(
        missingVaultIds.map((vaultId) => vaultApi.getById(vaultId)),
      )
      for (const result of missingVaults) {
        if (result.status === 'fulfilled') {
          vaultCache.set(result.value.id, result.value)
        }
      }
    }

    for (const member of members) {
      try {
        let dek = dekCache.get(member.vaultId)
        if (!dek) {
          const vault = vaultCache.get(member.vaultId)
          if (!vault) {
            throw new Error('EndPlan not available for pending access grant')
          }
          const unwrappedDek = await unwrapDekWithKeyPair(
            vault.wrappedDek,
            actorPublicKeyB64,
            actorPrivateKeyB64,
            actorPqPrivateKeyB64,
            { vaultId: member.vaultId },
          )
          if (!unwrappedDek) {
            throw new Error(`Failed to derive DEK for vault ${member.vaultId}`)
          }
          dek = unwrappedDek
          dekCache.set(member.vaultId, unwrappedDek)
        }
        const resolvedDek = dek
        if (!resolvedDek) {
          throw new Error(`Failed to derive DEK for vault ${member.vaultId}`)
        }

        // Re-wrap DEK for this member's public key
        const wrappedDekForMember = await wrapDekForPublicKey(
          resolvedDek,
          member.publicKeyB64,
          member.pqPublicKeyB64,
          {
            vaultId: member.vaultId,
            requireHybrid: recipientExpectsHybridWrap(member),
          },
        )

        // Grant access via API
        await accessApi.grantVaultAccess(member.vaultId, {
          userId: member.memberId,
          wrappedDek: wrappedDekForMember,
          role: member.role,
          accessLevel: getAccessLevelForRole(member.role),
        })

        granted++
      } catch (err) {
        const errorMsg = err instanceof Error
          ? `Failed to grant pending trusted circle access: ${err.message}`
          : 'Failed to grant pending trusted circle access.'
        errors.push(errorMsg)
      }
    }

    return { granted, errors }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Failed to process pending trusted circle access')
    return { granted, errors }
  }
}
