import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrUpdateEndPlan, saveEndPlan } from './endplan-service'
import type { VaultResponse } from '../clients/vault-api'
import { vaultKeys } from '../keys/vault-query-keys'

type CreateOrUpdateEndPlanParams = {
  existingVault: VaultResponse | null
  name: string
  description?: string
  content: string
  publicKeyB64: string
  pqPublicKeyB64?: string | null
  privateKeyB64?: string
  pqPrivateKeyB64?: string | null
  ownerId: string
}

type SaveEndPlanParams = {
  vault: VaultResponse
  name?: string
  description?: string
  content: string
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
}

function syncVaultCache(queryClient: QueryClient, vault: VaultResponse) {
  queryClient.setQueryData(vaultKeys.byId(vault.id), vault)
  queryClient.invalidateQueries({ queryKey: vaultKeys.owned() })
  queryClient.invalidateQueries({ queryKey: vaultKeys.all })
}

export function useCreateOrUpdateEndPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateOrUpdateEndPlanParams) => createOrUpdateEndPlan(params),
    onSuccess: (vault) => {
      syncVaultCache(queryClient, vault)
    },
  })
}

export function useSaveEndPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SaveEndPlanParams) => saveEndPlan(params),
    onSuccess: (vault) => {
      syncVaultCache(queryClient, vault)
    },
  })
}
