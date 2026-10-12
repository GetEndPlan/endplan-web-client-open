import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/shared/lib/misc'
import { usePatchOnboardingState } from '@/features/auth'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import {
  getKeyPersonInactivityAccessPromptKey,
  KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY,
  type TrustedCircleMembership,
  useMarkUserPromptDismissed,
  useSentInvitations,
  useTrustedCircle,
  useUserPromptState,
} from '@/features/trusted-circle'
import type { SharedVault } from '../../api/clients/vault-api'
import { releaseApi } from '../../api/clients/release-api'
import {
  useDecryptedUserVault,
  useVaultSections,
  useVaultsOwned,
} from '@/features/endplan/api/hooks/queries/use-vault-queries'
import { SECTION_ID } from '@/features/endplan/model/vault-section-types'
import { useRecentActivity } from '@/features/endplan/api/hooks/queries/use-activity-queries'
import { useKeys } from '@/features/keys/api/hooks/keys-hooks'
import { useTrustedMemberView } from '../onboarding/use-trusted-member-view'
import { useGrantPendingAccess } from '../onboarding/use-grant-pending-access'
import {
  readDashboardNavTourSettled,
  writeDashboardNavTourSettled,
} from '@/features/onboarding/lib/dashboard-nav-tour-storage'
import type { UserOnboardingState } from '@/features/auth/api/profile-api'
import { userKeys } from '@/features/auth/api/hooks/user-hooks'
import { countActiveKeyPersons } from '../../model/plan-quota-guards'

function selectInactivityReleasedSharedVault(
  sharedVaults: SharedVault[],
  memberships: TrustedCircleMembership[],
): SharedVault | null {
  const eligibleOwnerEmails = new Set(
    memberships
      .filter((membership) =>
        membership.role === 'key_person' &&
        membership.status === 'active' &&
        membership.accessTiming === 'in_end' &&
        membership.accessGrantStatus === 'available',
      )
      .map((membership) => membership.member?.email?.trim().toLowerCase())
      .filter((email): email is string => !!email),
  )

  if (eligibleOwnerEmails.size === 0) {
    return null
  }

  const candidates = sharedVaults.filter((sharedVault) =>
    sharedVault.role === 'key_person' &&
    sharedVault.accessGrantStatus === 'available' &&
    eligibleOwnerEmails.has(sharedVault.ownerEmail.trim().toLowerCase()),
  )

  if (candidates.length === 0) {
    return null
  }

  return [...candidates].sort((a, b) => {
    const left = Date.parse(a.grantedAt)
    const right = Date.parse(b.grantedAt)
    const leftValue = Number.isNaN(left) ? 0 : left
    const rightValue = Number.isNaN(right) ? 0 : right
    return rightValue - leftValue
  })[0] ?? null
}

export function useDashboardPage() {
  const { user, onboarding } = useAuthUser()
  const queryClient = useQueryClient()
  const patchOnboardingState = usePatchOnboardingState()
  const queryEnabled = !!user
  const postReleaseRecoveryQuery = useQuery({
    queryKey: ['release', 'recovery', 'status'],
    queryFn: releaseApi.getPostReleaseRecoveryStatus,
    enabled: queryEnabled,
    staleTime: 30_000,
  })

  const {
    vault,
    isCreated,
    isLoading: isVaultLoading,
    isResolved: isVaultChecked,
  } = useDecryptedUserVault({ enabled: queryEnabled, ownerUserId: user?.id })
  const {
    isTrustedMemberView,
    sharedVaults,
    memberships,
    pendingClaims,
    isLoadingShared,
    isLoadingClaims,
    refetchSharedVaults,
    refetchClaims,
  } = useTrustedMemberView({ enabled: queryEnabled })

  const { data: ownedVaults = [] } = useVaultsOwned({ enabled: queryEnabled })
  const { data: subscription } = useSubscription({ enabled: queryEnabled })
  const { data: members = [] } = useTrustedCircle({ enabled: queryEnabled })
  const { data: sentInvitations = [] } = useSentInvitations({ enabled: queryEnabled })
  const { data: keyPersonStartOwnEndplanPromptState } = useUserPromptState(
    KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY,
    { enabled: queryEnabled },
  )
  const recentActivityQuery = useRecentActivity({ limit: 10, enabled: queryEnabled })
  const keysQuery = useKeys({ enabled: queryEnabled })
  const sectionsQuery = useVaultSections(vault?.id, {
    enabled: queryEnabled && !!vault?.id,
  })
  const hasVaultRecoverySection = (sectionsQuery.data ?? []).some(
    (s) => s.sectionType === SECTION_ID.RECOVERY,
  )

  useGrantPendingAccess({
    vault,
    sharedVaults,
    isVaultChecked,
    enabled: subscription != null && subscription.canAccess,
  })

  const stillLoading = isVaultLoading || !isVaultChecked
  const vaultCountLabel = String(ownedVaults.length)
  const recentActivity = (recentActivityQuery.data?.activity ?? []).slice(0, 3)
  const lastUpdatedLabel = (() => {
    let latestMs: number | null = null
    let latestIso: string | null = null
    for (const value of [vault?.updatedAt, recentActivity[0]?.createdAt]) {
      if (!value) continue
      const parsed = Date.parse(value)
      if (Number.isNaN(parsed)) continue
      if (latestMs == null || parsed > latestMs) {
        latestMs = parsed
        latestIso = value
      }
    }
    return latestIso ? formatDate(latestIso) : '-'
  })()
  const postReleaseRecoveryRequired = postReleaseRecoveryQuery.data?.required === true
  const postReleaseRecoveryInactivityDays =
    postReleaseRecoveryQuery.data?.inactivityPeriodDays ?? null
  const postReleaseRecoveryKeyPersonNames =
    postReleaseRecoveryQuery.data?.accessNowKeyPersonNames ?? []
  const hasSubscriptionAccessEnded = subscription?.canAccess === false
  const userId = user?.id ?? null
  const keyPersonCount = countActiveKeyPersons({ members, sentInvitations })
  const inactivityReleasedSharedVault = selectInactivityReleasedSharedVault(sharedVaults, memberships)
  const inactivityAccessPromptKey =
    inactivityReleasedSharedVault != null
      ? getKeyPersonInactivityAccessPromptKey(inactivityReleasedSharedVault.id)
      : ''
  const { data: inactivityAccessPromptState, isLoading: isLoadingInactivityAccessPromptState } = useUserPromptState(
    inactivityAccessPromptKey,
    { enabled: queryEnabled && inactivityAccessPromptKey.length > 0 },
  )
  const dismissInactivityAccessPrompt = useMarkUserPromptDismissed(inactivityAccessPromptKey)
  const [dismissedInactivityAccessPromptKey, setDismissedInactivityAccessPromptKey] = useState<string | null>(null)

  const showInactivityAccessBanner =
    inactivityReleasedSharedVault != null &&
    !isLoadingInactivityAccessPromptState &&
    dismissedInactivityAccessPromptKey !== inactivityAccessPromptKey &&
    inactivityAccessPromptState?.dismissedAt == null

  const markInactivityAccessBannerDismissed = async () => {
    if (inactivityAccessPromptKey.length === 0) {
      return
    }

    setDismissedInactivityAccessPromptKey(inactivityAccessPromptKey)
    try {
      await dismissInactivityAccessPrompt.mutateAsync()
    } catch {
      // Keep UI dismissal even if persistence fails.
    }
  }
  const hasConvertedFromTrustedMemberToOwnEndplan =
    keyPersonStartOwnEndplanPromptState?.dismissedAt != null

  const canOfferWelcomeBase =
    !!userId &&
    !stillLoading &&
    (!isTrustedMemberView || hasConvertedFromTrustedMemberToOwnEndplan)

  const showWelcomeModal = canOfferWelcomeBase && !onboarding.dashboardWelcomeDismissed

  const keys = keysQuery.data
  const keysReady = keysQuery.isFetched && !keysQuery.isError
  const deferredMs = onboarding.recoveryPhraseOnboardingDeferredUntil
    ? Date.parse(onboarding.recoveryPhraseOnboardingDeferredUntil)
    : Number.NaN

  const [snoozeCompareAtMs, setSnoozeCompareAtMs] = useState(() => Date.now())

  useEffect(() => {
    if (!Number.isFinite(deferredMs)) return
    const remaining = deferredMs - Date.now()
    if (remaining <= 0) return
    const id = window.setTimeout(() => {
      setSnoozeCompareAtMs(Date.now())
    }, remaining)
    return () => window.clearTimeout(id)
  }, [deferredMs])

  const recoverySnoozeActive = Number.isFinite(deferredMs) && deferredMs > snoozeCompareAtMs

  const showRecoveryPhraseDisclosureModal =
    canOfferWelcomeBase &&
    keysReady &&
    keys != null &&
    keys.hasRecoveryWrap === true &&
    sectionsQuery.isSuccess &&
    hasVaultRecoverySection &&
    onboarding.dashboardNavTourSettled &&
    !onboarding.recoveryPhraseOnboardingCompleted &&
    !recoverySnoozeActive

  const showRecoveryPhraseSetupModal =
    canOfferWelcomeBase &&
    keysReady &&
    keys != null &&
    keys.hasRecoveryWrap !== true &&
    onboarding.dashboardNavTourSettled &&
    !onboarding.recoveryPhraseOnboardingCompleted &&
    !recoverySnoozeActive

  const markWelcomeContinueAck = () => {
    if (!userId || onboarding.dashboardWelcomeIntroAcknowledged) return
    patchOnboardingState.mutate({ dashboardWelcomeIntroAcknowledged: true })
  }

  const dismissWelcomeModal = () => {
    if (!userId) return Promise.resolve()
    return patchOnboardingState.mutateAsync({
      dashboardWelcomeDismissed: true,
      dashboardWelcomeIntroAcknowledged: true,
    })
  }

  const dashboardNavTourSettled =
    onboarding.dashboardNavTourSettled || readDashboardNavTourSettled(userId)

  const markDashboardNavTourSettled = () => {
    if (!userId || dashboardNavTourSettled) {
      return
    }

    writeDashboardNavTourSettled(userId)

    const nextOnboarding: UserOnboardingState = {
      ...onboarding,
      dashboardNavTourSettled: true,
    }
    queryClient.setQueryData<UserOnboardingState>(userKeys.onboarding(), nextOnboarding)
    queryClient.setQueryData(userKeys.profile(), (current) => {
      if (!current) {
        return { user: null, onboarding: nextOnboarding }
      }
      return { ...current, onboarding: nextOnboarding }
    })

    patchOnboardingState.mutate({ dashboardNavTourSettled: true })
  }

  return {
    canOfferDashboardNavTour: canOfferWelcomeBase,
    dashboardNavTourSettled,
    markDashboardNavTourSettled,
    user,
    vault,
    isCreated,
    sharedVaults,
    pendingClaims,
    isLoadingShared,
    isLoadingClaims,
    stillLoading,
    vaultCountLabel,
    sharedVaultCount: sharedVaults.length,
    lastUpdatedLabel,
    recentActivity,
    isLoadingRecentActivity: recentActivityQuery.isLoading,
    isRecentActivityError: recentActivityQuery.isError,
    refetchRecentActivity: recentActivityQuery.refetch,
    refetchSharedVaults,
    refetchClaims,
    inactivityReleasedSharedVault,
    showInactivityAccessBanner,
    markInactivityAccessBannerDismissed,
    showWelcomeModal,
    dismissWelcomeModal,
    markWelcomeContinueAck,
    keyPersonCount,
    postReleaseRecoveryRequired,
    postReleaseRecoveryInactivityDays,
    postReleaseRecoveryKeyPersonNames,
    isLoadingPostReleaseRecoveryStatus: postReleaseRecoveryQuery.isLoading,
    refetchPostReleaseRecoveryStatus: postReleaseRecoveryQuery.refetch,
    hasSubscriptionAccessEnded,
    showRecoveryPhraseDisclosureModal,
    showRecoveryPhraseSetupModal,
    keysForRecoveryPhraseSetup: keys && keys.hasRecoveryWrap !== true ? keys : null,
  }
}
