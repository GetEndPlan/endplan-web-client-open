import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, sharedEndplanPath } from '@/app/constants/routes'
import {
  useDashboardPage,
  useKeyPersonStartOwnEndplanPrompt,
  DashboardWelcomeModal,
  PostReleaseRecoveryModal,
  DashboardHeader,
  DashboardReadinessCard,
  DashboardSecurityCard,
  DashboardStats,
  DashboardLoadingState,
  VaultSectionGrid,
  RecentActivityCard,
  DashboardNetWorthCard,
  SharedVaultsList
} from '@/features/endplan'
import { createBillingUpgradeModalState } from '@/features/billing'
import {
  PendingClaimsCard,
  KeyPersonInactivityAccessBanner,
  KeyPersonStartOwnEndplanBanner,
  useStartOwnEndplanFlow,
  useClaimAccess,
} from '@/features/trusted-circle'
import { useMobileDrawer } from '@/app/layouts/hooks'
import { useDashboardNavTour } from '@/features/onboarding'
import {
  erasureApiMessage,
  ScheduledAccountDeletionRestoredModal,
  ScheduledAccountDeletionWelcomeModal,
  useScheduledAccountDeletionDashboard,
} from '@/features/erasure'
import { toast } from '@/shared/ui'
import { RecoveryPhraseDisclosureModal, RecoveryPhraseSetupModal } from '@/features/keys'
import type { PendingClaim } from '@/features/endplan'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { startOwnEndplan, isStarting } = useStartOwnEndplanFlow()
  const {
    showBanner: showKeyPersonStartOwnEndplanBanner,
    ownerName: keyPersonBannerOwnerName,
  } = useKeyPersonStartOwnEndplanPrompt()
  const claimAccessMutation = useClaimAccess()
  const scheduledAccountDeletion = useScheduledAccountDeletionDashboard()

  const {
    user,
    vault,
    isCreated,
    sharedVaults,
    pendingClaims,
    isLoadingShared,
    isLoadingClaims,
    stillLoading,
    sharedVaultCount,
    lastUpdatedLabel,
    recentActivity,
    isLoadingRecentActivity,
    isRecentActivityError,
    refetchRecentActivity,
    refetchSharedVaults,
    refetchClaims,
    inactivityReleasedSharedVault,
    showInactivityAccessBanner,
    markInactivityAccessBannerDismissed,
    showWelcomeModal,
    dismissWelcomeModal,
    markWelcomeContinueAck,
    showRecoveryPhraseDisclosureModal,
    showRecoveryPhraseSetupModal,
    keysForRecoveryPhraseSetup,
    canOfferDashboardNavTour,
    dashboardNavTourSettled,
    markDashboardNavTourSettled,
    keyPersonCount,
    postReleaseRecoveryRequired,
    postReleaseRecoveryInactivityDays,
    postReleaseRecoveryKeyPersonNames,
    refetchPostReleaseRecoveryStatus,
    hasSubscriptionAccessEnded,
  } = useDashboardPage()

  const showPostReleaseRecoveryModal = postReleaseRecoveryRequired && (user?.email.length ?? 0) > 0

  const { open: openMobileDrawer } = useMobileDrawer()

  useDashboardNavTour({
    userId: user?.id ?? null,
    canOffer: canOfferDashboardNavTour,
    settled: dashboardNavTourSettled,
    onSettled: markDashboardNavTourSettled,
    showWelcomeModal: showWelcomeModal || scheduledAccountDeletion.showWelcomeModal,
    stillLoading,
    blocked: showPostReleaseRecoveryModal || scheduledAccountDeletion.showWelcomeModal,
    openMobileDrawer,
  })

  if (!user) return null

  const handleClaim = async (claim: PendingClaim) => {
    try {
      const response = await claimAccessMutation.mutateAsync(claim.membershipId)
      if (response.alreadyRequested) {
        toast.success(t('dashboard.pendingAccess.alreadyRequested'))
      } else {
        toast.success(t('dashboard.pendingAccess.claimSuccess', { name: claim.ownerName }))
      }
      refetchSharedVaults()
      refetchClaims()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dashboard.pendingAccess.claimError')
      toast.error(message)
    }
  }

  const handleWelcomeFinish = async () => {
    try {
      await dismissWelcomeModal()
    } catch {
      // Cache stays stale until retry; tour hook will retry when onboarding updates.
    }
  }
  const handlePostReleaseRecoveryCompleted = async () => {
    try {
      await refetchPostReleaseRecoveryStatus()
    } catch {
      // Best effort only; the modal resolves server-side and dashboard state will catch up on next fetch.
    }

    if (hasSubscriptionAccessEnded) {
      navigate(ROUTES.SETTINGS_BILLING_UPGRADE, {
        state: createBillingUpgradeModalState(location),
      })
    }
  }
  const stats = [
    {
      label: t('dashboard.stats.keyPersons'),
      value: String(keyPersonCount),
      icon: 'key-person' as const,
    },
    {
      label: t('dashboard.stats.sharedWithMe'),
      value: String(sharedVaultCount),
      icon: 'documents' as const,
    },
    {
      label: t('dashboard.stats.lastUpdated'),
      value: lastUpdatedLabel,
      icon: 'time' as const,
    },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto lg:gap-5 lg:overflow-hidden lg:pb-[40px]">
      {showPostReleaseRecoveryModal ? (
        <PostReleaseRecoveryModal
          userName={user.name}
          email={user.email}
          inactivityPeriodDays={postReleaseRecoveryInactivityDays}
          accessNowKeyPersonNames={postReleaseRecoveryKeyPersonNames}
          onCompleted={handlePostReleaseRecoveryCompleted}
        />
      ) : null}

      {!showPostReleaseRecoveryModal && scheduledAccountDeletion.showWelcomeModal ? (
        <ScheduledAccountDeletionWelcomeModal
          isOpen
          daysRemaining={scheduledAccountDeletion.daysRemaining}
          firstName={scheduledAccountDeletion.welcomeFirstName}
          isRestoring={scheduledAccountDeletion.isRestoring}
          onDismiss={scheduledAccountDeletion.dismissWelcome}
          onRestore={async () => {
            try {
              await scheduledAccountDeletion.restoreAccount()
              toast.success(t('settings.erasure.scheduledDeletion.toastRestored'))
            } catch (e) {
              toast.error(erasureApiMessage(e) ?? t('settings.erasure.toast.cancelError'))
            }
          }}
        />
      ) : null}

      {!showPostReleaseRecoveryModal &&
      !scheduledAccountDeletion.showWelcomeModal &&
      scheduledAccountDeletion.showRestoredModal ? (
        <ScheduledAccountDeletionRestoredModal isOpen onClose={scheduledAccountDeletion.closeRestoredModal} />
      ) : null}

      {!showPostReleaseRecoveryModal &&
      !scheduledAccountDeletion.showWelcomeModal &&
      showWelcomeModal ? (
        <DashboardWelcomeModal
          onClose={dismissWelcomeModal}
          onContinueAck={markWelcomeContinueAck}
          onFinish={handleWelcomeFinish}
        />
      ) : null}

      {!showPostReleaseRecoveryModal &&
      !scheduledAccountDeletion.showWelcomeModal &&
      !showWelcomeModal &&
      showRecoveryPhraseDisclosureModal &&
      vault ? (
        <RecoveryPhraseDisclosureModal vault={vault} onClose={() => {}} />
      ) : null}

      {!showPostReleaseRecoveryModal &&
      !scheduledAccountDeletion.showWelcomeModal &&
      !showWelcomeModal &&
      !showRecoveryPhraseDisclosureModal &&
      showRecoveryPhraseSetupModal &&
      keysForRecoveryPhraseSetup ? (
        <RecoveryPhraseSetupModal keys={keysForRecoveryPhraseSetup} onClose={() => {}} />
      ) : null}

      <DashboardHeader
        userName={user.name}
        stillLoading={stillLoading}
        isCreated={isCreated}
      />

      {stillLoading ? (
        <DashboardLoadingState />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:gap-5">
          <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-stretch lg:gap-4">
            <DashboardReadinessCard />
            <DashboardSecurityCard />
          </div>

          <DashboardStats stats={stats} />

          {showKeyPersonStartOwnEndplanBanner ? (
            <KeyPersonStartOwnEndplanBanner
              ownerName={keyPersonBannerOwnerName}
              onStart={() => void startOwnEndplan()}
              isStarting={isStarting}
            />
          ) : null}

          {inactivityReleasedSharedVault && showInactivityAccessBanner ? (
            <KeyPersonInactivityAccessBanner
              ownerName={inactivityReleasedSharedVault.ownerName}
              onAccessNow={() => {
                void markInactivityAccessBannerDismissed()
                navigate(sharedEndplanPath(inactivityReleasedSharedVault.id))
              }}
            />
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-stretch">
              <DashboardNetWorthCard vault={vault} />
              <RecentActivityCard
                activity={recentActivity}
                isLoading={isLoadingRecentActivity}
                isError={isRecentActivityError}
                onRetry={() => {
                  void refetchRecentActivity()
                }}
              />
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-stretch">
              <VaultSectionGrid vault={vault} />
              <SharedVaultsList
                sharedVaults={sharedVaults}
                isLoading={isLoadingShared}
                variant="featured"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending Claims */}
      <PendingClaimsCard
        claims={pendingClaims}
        isLoading={isLoadingClaims}
        onClaim={handleClaim}
        claimingId={claimAccessMutation.isPending ? (claimAccessMutation.variables ?? null) : null}
      />
    </div>
  )
}
