import { useMemberships, usePendingClaims } from '@/features/trusted-circle'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription, isInviteOnlyKeyPersonOnboarding } from '@/features/billing'
import {
  useDecryptedUserVault,
  useUserVaultSectionContent,
  useVaultsShared,
} from '../../api/hooks/queries/use-vault-queries'

type TrustedMemberViewState = {
  isPartOfTrustedCircle: boolean
  isTrustedMemberView: boolean
}

function resolveTrustedMemberViewState(params: {
  hasOwnEndplan: boolean
  membershipsCount: number
  inviteOnlyKeyPersonOnboarding: boolean
}): TrustedMemberViewState {
  const { hasOwnEndplan, membershipsCount, inviteOnlyKeyPersonOnboarding } = params
  const isPartOfTrustedCircle = membershipsCount > 0

  return {
    isPartOfTrustedCircle,
    isTrustedMemberView:
      inviteOnlyKeyPersonOnboarding && !hasOwnEndplan && isPartOfTrustedCircle,
  }
}

/**
 * Single source of truth for "trusted member view": invite-only key persons with no
 * own EndPlan content yet. Established accounts keep owner UX even on free tier.
 */
export function useTrustedMemberView(options?: { enabled?: boolean }) {
  const { user } = useAuthUser()
  const enabled = (options?.enabled ?? true) && !!user

  const { isCreated } = useDecryptedUserVault({ enabled, ownerUserId: user?.id })
  const {
    hasVaultSectionContent,
    isResolved: isVaultSectionContentResolved,
  } = useUserVaultSectionContent({ enabled, ownerUserId: user?.id })
  const { data: memberships = [], isLoading: isLoadingMemberships } = useMemberships({ enabled })
  const { data: sharedVaults = [], isLoading: isLoadingShared, refetch: refetchShared } = useVaultsShared({ enabled })
  const { data: pendingClaims = [], isLoading: isLoadingClaims, refetch: refetchClaims } = usePendingClaims({ enabled })
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription({ enabled })

  const hasOwnEndplan = isCreated || hasVaultSectionContent
  const inviteOnlyKeyPersonOnboarding = isInviteOnlyKeyPersonOnboarding({
    subscriptionLoaded: !isLoadingSubscription,
    keyPersonBillingPendingAck: subscription?.keyPersonBillingPendingAck,
    keyPersonEstablishedBeforeInvite: subscription?.keyPersonEstablishedBeforeInvite,
  })

  const { isPartOfTrustedCircle, isTrustedMemberView } = resolveTrustedMemberViewState({
    hasOwnEndplan,
    membershipsCount: memberships.length,
    inviteOnlyKeyPersonOnboarding,
  })

  // Determines whether the app can safely choose owner vs trusted-member UX.
  const isLoadingViewType =
    !hasOwnEndplan &&
    (isLoadingMemberships || isLoadingSubscription || !isVaultSectionContentResolved)
  const isLoading = isLoadingMemberships || isLoadingShared || isLoadingClaims

  return {
    isTrustedMemberView,
    isPartOfTrustedCircle,
    isLoadingViewType,
    isLoading,
    isLoadingMemberships,
    isLoadingShared,
    isLoadingClaims,
    memberships,
    sharedVaults,
    pendingClaims,
    refetchSharedVaults: refetchShared,
    refetchClaims,
  }
}

/** @deprecated Prefer useTrustedMemberView for new usage. */
export function useIsTrustedMemberView() {
  return useTrustedMemberView()
}
