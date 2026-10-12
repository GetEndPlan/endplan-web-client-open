import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import { ensureOwnedVaultIfMissing, vaultKeys } from '@/features/endplan'
import { useKeysStore } from '@/features/keys'
import { ApiRequestsBlockedError } from '@/shared/api/client'

/**
 * After login or unlock, creates an owned EndPlan vault when none exists so vault
 * sections do not show the “create from dashboard” empty state.
 */
export function useEnsureOwnedVaultOnUnlock() {
  const { user } = useAuthUser()
  const queryClient = useQueryClient()
  const publicKeyB64 = useKeysStore((s) => s.publicKeyB64)
  const privateKeyB64 = useKeysStore((s) => s.privateKeyB64)
  const pqPublicKeyB64 = useKeysStore((s) => s.pqPublicKeyB64)
  const { data: subscription, isPending: isSubscriptionPending } = useSubscription({ enabled: !!user })
  const userId = user?.id
  const canAccess = subscription?.canAccess !== false

  useEffect(() => {
    if (!userId || !publicKeyB64 || !privateKeyB64 || isSubscriptionPending || !canAccess) {
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const created = await ensureOwnedVaultIfMissing({
          ownerId: userId,
          publicKeyB64,
          pqPublicKeyB64,
        })
        if (cancelled || !created) {
          return
        }
        await queryClient.invalidateQueries({ queryKey: vaultKeys.all })
      } catch (error) {
        if (error instanceof ApiRequestsBlockedError) {
          return
        }
        // Non-fatal: user can refresh; avoid noisy toast on background ensure
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, publicKeyB64, privateKeyB64, pqPublicKeyB64, isSubscriptionPending, canAccess, queryClient])
}
