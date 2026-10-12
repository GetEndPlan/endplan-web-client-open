import { useQuery } from '@tanstack/react-query'
import { releaseApi } from '@/features/endplan'
import { releaseKeys, trustedCircleKeys } from '../keys/trusted-circle-query-keys'
import { trustedCircleApi } from '../clients/trusted-circle-api'
import { invitationApi } from '../clients/invitation-api'
import { accessApi } from '../clients/access-api'
import { userPromptStateApi } from '../clients/user-prompt-state-api'

type QueryOptions = { enabled?: boolean }

export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: trustedCircleKeys.token(token || ''),
    queryFn: () => invitationApi.getByToken(token || ''),
    enabled: !!token,
    retry: false,
  })
}

export function useTrustedCircle(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.members(),
    queryFn: trustedCircleApi.listMyCircle,
    select: (data) => data.members,
    enabled: options?.enabled ?? true,
  })
}

export function useMemberships(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.memberships(),
    queryFn: trustedCircleApi.listMyMemberships,
    select: (data) => data.memberships,
    enabled: options?.enabled ?? true,
  })
}

export function useUserPromptState(promptKey: string, options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.promptState(promptKey),
    queryFn: () => userPromptStateApi.get(promptKey),
    enabled: (options?.enabled ?? true) && promptKey.length > 0,
  })
}

export function useReceivedInvitations(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.invitations(),
    queryFn: invitationApi.listReceived,
    select: (data) => data.invitations,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

export function useSentInvitations(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.sentInvitations(),
    queryFn: invitationApi.listSent,
    select: (data) => data.invitations,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

export function usePendingAccess(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.pendingAccess(),
    queryFn: accessApi.listPendingAccess,
    select: (data) => data.members,
    enabled: options?.enabled ?? true,
  })
}

export function usePendingReleaseInvitations(options?: QueryOptions) {
  return useQuery({
    queryKey: trustedCircleKeys.pendingReleaseInvitations(),
    queryFn: invitationApi.listPendingRelease,
    select: (data) => data.invitations,
    enabled: options?.enabled ?? true,
  })
}

export function usePendingClaims(options?: QueryOptions) {
  return useQuery({
    queryKey: releaseKeys.pendingClaims(),
    queryFn: releaseApi.listPendingClaims,
    select: (data) => data?.claims || [],
    enabled: options?.enabled ?? true,
  })
}
