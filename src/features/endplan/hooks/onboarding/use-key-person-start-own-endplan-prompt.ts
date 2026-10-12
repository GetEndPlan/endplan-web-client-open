import { useMemo } from 'react'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription, isInviteOnlyKeyPersonOnboarding } from '@/features/billing'
import {
  useUserPromptState,
  KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY,
  type TrustedCircleMembership,
} from '@/features/trusted-circle'
import {
  useDecryptedUserVault,
  useUserVaultSectionContent,
} from '@/features/endplan/api/hooks/queries/use-vault-queries'
import { useTrustedMemberView } from './use-trusted-member-view'

type KeyPersonStartOwnEndplanPromptState = {
  showBanner: boolean
  ownerName: string | null
}

type ResolveKeyPersonStartOwnEndplanPromptParams = {
  isReady: boolean
  hasOwnEndplan: boolean
  hasActiveSubscription: boolean
  canAccess: boolean
  inviteOnlyKeyPersonOnboarding: boolean
  eligibleKeyPersonMembership: TrustedCircleMembership | null
  dismissedAt: string | null | undefined
  keyPersonBillingOwnerName?: string | null
}

export function getLatestKeyPersonMembership(memberships: TrustedCircleMembership[]) {
  const activeKeyPersonMemberships = memberships.filter(
    (membership) => membership.role === 'key_person' && membership.status === 'active'
  )

  if (activeKeyPersonMemberships.length === 0) {
    return null
  }

  return [...activeKeyPersonMemberships].sort((left, right) => {
    const leftDate = left.acceptedAt ?? left.invitedAt
    const rightDate = right.acceptedAt ?? right.invitedAt
    return new Date(rightDate).getTime() - new Date(leftDate).getTime()
  })[0]
}

export function resolveKeyPersonStartOwnEndplanPrompt({
  isReady,
  hasOwnEndplan,
  hasActiveSubscription,
  canAccess,
  inviteOnlyKeyPersonOnboarding,
  eligibleKeyPersonMembership,
  dismissedAt,
  keyPersonBillingOwnerName,
}: ResolveKeyPersonStartOwnEndplanPromptParams): KeyPersonStartOwnEndplanPromptState {
  const canStartOwnEndplan =
    inviteOnlyKeyPersonOnboarding &&
    !hasOwnEndplan &&
    canAccess &&
    !hasActiveSubscription &&
    eligibleKeyPersonMembership != null

  const ownerName =
    keyPersonBillingOwnerName?.trim() ||
    eligibleKeyPersonMembership?.member?.name ||
    null

  return {
    showBanner: isReady && canStartOwnEndplan && dismissedAt == null,
    ownerName,
  }
}

export function useKeyPersonStartOwnEndplanPrompt(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const { user } = useAuthUser()
  const {
    isCreated,
    isLoading: isVaultLoading,
    isResolved: isVaultResolved,
  } = useDecryptedUserVault({ enabled, ownerUserId: user?.id })
  const {
    hasVaultSectionContent,
    isLoading: isVaultSectionContentLoading,
    isResolved: isVaultSectionContentResolved,
  } = useUserVaultSectionContent({ enabled, ownerUserId: user?.id })
  const {
    memberships,
    isLoadingMemberships,
  } = useTrustedMemberView({ enabled })
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription({ enabled })
  const { data: promptState, isLoading: isLoadingPromptState } = useUserPromptState(
    KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY,
    { enabled }
  )

  const eligibleKeyPersonMembership = useMemo(
    () => getLatestKeyPersonMembership(memberships),
    [memberships]
  )
  const hasOwnEndplan = isCreated || hasVaultSectionContent
  const inviteOnlyKeyPersonOnboarding = isInviteOnlyKeyPersonOnboarding({
    subscriptionLoaded: !isLoadingSubscription,
    keyPersonBillingPendingAck: subscription?.keyPersonBillingPendingAck,
    keyPersonEstablishedBeforeInvite: subscription?.keyPersonEstablishedBeforeInvite,
  })
  const isReady =
    !isVaultLoading &&
    isVaultResolved &&
    !isVaultSectionContentLoading &&
    isVaultSectionContentResolved &&
    !isLoadingMemberships &&
    !isLoadingSubscription &&
    !isLoadingPromptState

  return resolveKeyPersonStartOwnEndplanPrompt({
    isReady,
    hasOwnEndplan,
    hasActiveSubscription: Boolean(subscription?.hasActiveSubscription),
    canAccess: subscription?.canAccess ?? true,
    inviteOnlyKeyPersonOnboarding,
    eligibleKeyPersonMembership,
    dismissedAt: promptState?.dismissedAt,
    keyPersonBillingOwnerName: subscription?.keyPersonBillingOwnerName,
  })
}
