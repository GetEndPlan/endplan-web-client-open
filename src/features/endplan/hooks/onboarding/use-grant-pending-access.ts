import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/shared/ui'
import { useKeyMaterial } from '@/features/keys'
import { grantAccessToPendingMembers } from '@/features/trusted-circle'
import type { SharedVault, VaultResponse } from '../../api/clients/vault-api'

type UseGrantPendingAccessParams = {
  vault: VaultResponse | null
  sharedVaults: SharedVault[]
  isVaultChecked: boolean
  enabled?: boolean
}

type GrantInput = {
  actorPublicKeyB64: string
  actorPrivateKeyB64: string
  actorPqPrivateKeyB64?: string | null
  vault?: VaultResponse
  sharedVaults: SharedVault[]
}

export function useGrantPendingAccess({
  vault,
  sharedVaults,
  isVaultChecked,
  enabled = true,
}: UseGrantPendingAccessParams) {
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial()

  const grantMutation = useMutation({
    mutationFn: (input: GrantInput) => grantAccessToPendingMembers(input),
    onSuccess: ({ granted }) => {
      if (granted > 0) {
        toast.success(`Granted EndPlan access to ${granted} trusted circle member${granted > 1 ? 's' : ''}`)
      }
    },
  })

  const triggeredKeyRef = useRef<string | null>(null)

  const grantKey = enabled && publicKeyB64 && privateKeyB64 && isVaultChecked
    ? `${publicKeyB64}:${vault?.id ?? 'all'}:${pqPrivateKeyB64 ? 'pq' : 'classic'}`
    : null

  useEffect(() => {
    if (!grantKey || !publicKeyB64 || !privateKeyB64) return
    if (triggeredKeyRef.current === grantKey) return
    if (grantMutation.isPending) return

    triggeredKeyRef.current = grantKey

    grantMutation.mutate({
      actorPublicKeyB64: publicKeyB64,
      actorPrivateKeyB64: privateKeyB64,
      actorPqPrivateKeyB64: pqPrivateKeyB64,
      vault: vault ?? undefined,
      sharedVaults,
    }, {
      onError: () => {
        triggeredKeyRef.current = null
      },
    })
  }, [grantKey, publicKeyB64, privateKeyB64, pqPrivateKeyB64, vault, sharedVaults, grantMutation])
}
