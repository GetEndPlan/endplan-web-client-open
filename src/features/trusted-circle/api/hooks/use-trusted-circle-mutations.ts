import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { releaseApi, vaultKeys } from '@/features/endplan'
import type { UpdateTrustedCircleMemberRequest } from '../clients/trusted-circle-api'
import { releaseKeys, trustedCircleKeys } from '../keys/trusted-circle-query-keys'
import { trustedCircleApi } from '../clients/trusted-circle-api'
import { invitationApi } from '../clients/invitation-api'
import { userPromptStateApi } from '../clients/user-prompt-state-api'

/** Invalidate all trusted-circle queries so the page refetches members, invitations, etc. */
function invalidateTrustedCircleQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: trustedCircleKeys.all })
}

function setPromptState(queryClient: QueryClient, promptKey: string, state: unknown) {
  queryClient.setQueryData(trustedCircleKeys.promptState(promptKey), state)
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationApi.create,
    onSuccess: () => {
      invalidateTrustedCircleQueries(queryClient)
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: trustedCircleApi.removeMember,
    onSuccess: () => {
      invalidateTrustedCircleQueries(queryClient)
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { memberId: string; data: UpdateTrustedCircleMemberRequest }) =>
      trustedCircleApi.updateMember(params.memberId, params.data),
    onSuccess: () => {
      invalidateTrustedCircleQueries(queryClient)
    },
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationApi.cancel,
    onSuccess: () => {
      invalidateTrustedCircleQueries(queryClient)
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.memberships() })
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.invitations() })
    },
  })
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationApi.decline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.invitations() })
    },
  })
}

export function useReleaseAllInvitations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitationApi.releaseAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.pendingReleaseInvitations() })
      queryClient.invalidateQueries({ queryKey: trustedCircleKeys.sentInvitations() })
    },
  })
}

export function useShareVaultAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vaultId, recipientId }: { vaultId: string; recipientId: string }) =>
      releaseApi.releaseToRecipient(vaultId, recipientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useClaimAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: releaseApi.claimAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.pendingClaims() })
      queryClient.invalidateQueries({ queryKey: vaultKeys.all })
    },
  })
}

export function useMarkUserPromptStarted(promptKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userPromptStateApi.markStarted(promptKey),
    onSuccess: (state) => {
      setPromptState(queryClient, promptKey, state)
    },
  })
}

export function useMarkUserPromptDismissed(promptKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userPromptStateApi.markDismissed(promptKey),
    onSuccess: (state) => {
      setPromptState(queryClient, promptKey, state)
    },
  })
}
