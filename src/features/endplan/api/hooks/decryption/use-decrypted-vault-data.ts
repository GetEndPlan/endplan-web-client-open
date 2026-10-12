import { useQuery } from '@tanstack/react-query'
import { decryptEndPlan, type EndPlanData } from '../../services/endplan-service'
import type { VaultResponse } from '../../clients/vault-api'

type UseDecryptedVaultDataParams = {
  vault: VaultResponse | null
  publicKeyB64: string | null
  privateKeyB64: string | null
  pqPrivateKeyB64?: string | null
  queryKey: readonly unknown[]
  enabled?: boolean
}

export function useDecryptedVaultData(params: UseDecryptedVaultDataParams) {
  const { vault, publicKeyB64, privateKeyB64, pqPrivateKeyB64, queryKey, enabled = true } = params

  const canDecrypt = !!vault && !!publicKeyB64 && !!privateKeyB64 && enabled

  const query = useQuery({
    queryKey,
    queryFn: () =>
      decryptEndPlan({
        vault: vault!,
        publicKeyB64: publicKeyB64!,
        privateKeyB64: privateKeyB64!,
        pqPrivateKeyB64,
      }),
    enabled: canDecrypt,
    retry: false,
    // Failed decrypts must not refetch on remount — an empty vault shell would
    // otherwise hammer the same S3 blob URL in a loop.
    refetchOnMount: (decryptQuery) => decryptQuery.state.status !== 'error',
    refetchOnReconnect: false,
  })

  return {
    ...query,
    canDecrypt,
    data: (query.data ?? null) as EndPlanData | null,
  }
}
