import { ProfileSettingsForm } from '@/features/auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  SettingsBillingPanel,
  SettingsBillingUpgradeModal,
  createBillingUpgradeModalState,
  billingKeys,
  type BillingUpgradeModalLocationState,
  useAcknowledgeKeyPersonFree,
} from '@/features/billing'
import { useKeyPersonFreeTrialColumn } from '@/features/billing/hooks/use-key-person-free-trial-column'
import { ROUTES } from '@/app/constants/routes'
import { ApiError } from '@/shared/api'
import { toast } from '@/shared/ui'
import { useQueryClient } from '@tanstack/react-query'
import { SettingsShell } from './settings-shell'

function keyPersonAckErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.apiMessage) {
    return error.apiMessage
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export { SettingsDataPrivacyPage } from './data-privacy-page'

export function SettingsPage() {
  return (
    <SettingsShell>
      <ProfileSettingsForm />
    </SettingsShell>
  )
}

export function SettingsBillingPage() {
  return <SettingsBillingScreen showUpgradeModal={false} />
}

export function SettingsBillingUpgradePage() {
  return <SettingsBillingScreen showUpgradeModal />
}

export function SettingsBillingUpgradeModalPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const state = location.state as BillingUpgradeModalLocationState | null
  const { billing, showKeyPersonFreeTrial } = useKeyPersonFreeTrialColumn(state)
  const acknowledgeKeyPersonFree = useAcknowledgeKeyPersonFree()

  if (!billing.user) {
    return null
  }

  const closeUpgradeModal = () => {
    if (state?.backgroundLocation) {
      navigate(-1)
      return
    }

    navigate(state?.returnTo ?? ROUTES.SETTINGS_BILLING, { replace: true })
  }

  const handleKeyPersonContinueFreeOrTrial = async () => {
    try {
      await acknowledgeKeyPersonFree.mutateAsync()
      closeUpgradeModal()
    } catch (error) {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
      toast.error(keyPersonAckErrorMessage(error, t('dashboard.keyPersonPrompt.dismissError')))
    }
  }

  const flowPending =
    (showKeyPersonFreeTrial && acknowledgeKeyPersonFree.isPending) || billing.isCreatingCheckout

  return (
    <SettingsBillingUpgradeModal
      hasActiveSubscription={billing.hasActiveSubscription}
      inTrial={billing.inTrial}
      trialEndsAt={billing.trialEndsAt}
      canAccess={billing.canAccess}
      formatDate={billing.formatDate}
      isLoading={billing.isLoading}
      subscription={billing.subscription}
      basicMonthlyProduct={billing.basicMonthlyProduct}
      basicYearlyProduct={billing.basicYearlyProduct}
      proMonthlyProduct={billing.proMonthlyProduct}
      proYearlyProduct={billing.proYearlyProduct}
      basicYearlySavings={billing.basicYearlySavings}
      proYearlySavings={billing.proYearlySavings}
      isCreatingCheckout={billing.isCreatingCheckout}
      flowPending={showKeyPersonFreeTrial ? flowPending : undefined}
      keyPersonTrialColumn={
        showKeyPersonFreeTrial
          ? {
              onStartTrial: () => void handleKeyPersonContinueFreeOrTrial(),
              isPending: acknowledgeKeyPersonFree.isPending,
            }
          : undefined
      }
      onSubscribe={billing.handleSubscribe}
      formatPrice={billing.formatPrice}
      onClose={closeUpgradeModal}
      footerContent={ undefined}
    />
  )
}

function SettingsBillingScreen({ showUpgradeModal }: { showUpgradeModal: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const state = location.state as BillingUpgradeModalLocationState | null
  const { billing, showKeyPersonFreeTrial } = useKeyPersonFreeTrialColumn(state)
  const acknowledgeKeyPersonFree = useAcknowledgeKeyPersonFree()
  const { t } = useTranslation()

  if (!billing.user) {
    return null
  }

  const closeUpgradeModal = () => {
    navigate(ROUTES.SETTINGS_BILLING)
  }

  const handleKeyPersonContinueFreeOrTrial = async () => {
    try {
      await acknowledgeKeyPersonFree.mutateAsync()
      closeUpgradeModal()
    } catch (error) {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
      toast.error(keyPersonAckErrorMessage(error, t('dashboard.keyPersonPrompt.dismissError')))
    }
  }

  const flowPending =
    (showKeyPersonFreeTrial && acknowledgeKeyPersonFree.isPending) || billing.isCreatingCheckout

  return (
    <SettingsShell>
      <>
        <SettingsBillingPanel
          subscription={billing.subscription}
          inTrial={billing.inTrial}
          trialEndsAt={billing.trialEndsAt}
          canAccess={billing.canAccess}
          showCancelConfirm={billing.showCancelConfirm}
          setShowCancelConfirm={billing.setShowCancelConfirm}
          handleManageSubscription={billing.handleManageSubscription}
          handleCancelSubscription={billing.handleCancelSubscription}
          formatDate={billing.formatDate}
          basicYearlySavings={billing.basicYearlySavings}
          proYearlySavings={billing.proYearlySavings}
          isCanceling={billing.isCanceling}
          onUpgrade={() =>
            navigate(ROUTES.SETTINGS_BILLING_UPGRADE, {
              state: createBillingUpgradeModalState(location),
            })
          }
        />

        {showUpgradeModal ? (
          <SettingsBillingUpgradeModal
            hasActiveSubscription={billing.hasActiveSubscription}
            inTrial={billing.inTrial}
            trialEndsAt={billing.trialEndsAt}
            canAccess={billing.canAccess}
            formatDate={billing.formatDate}
            isLoading={billing.isLoading}
            subscription={billing.subscription}
            basicMonthlyProduct={billing.basicMonthlyProduct}
            basicYearlyProduct={billing.basicYearlyProduct}
            proMonthlyProduct={billing.proMonthlyProduct}
            proYearlyProduct={billing.proYearlyProduct}
            basicYearlySavings={billing.basicYearlySavings}
            proYearlySavings={billing.proYearlySavings}
            isCreatingCheckout={billing.isCreatingCheckout}
            flowPending={showKeyPersonFreeTrial ? flowPending : undefined}
            keyPersonTrialColumn={
              showKeyPersonFreeTrial
                ? {
                    onStartTrial: () => void handleKeyPersonContinueFreeOrTrial(),
                    isPending: acknowledgeKeyPersonFree.isPending,
                  }
                : undefined
            }
            onSubscribe={billing.handleSubscribe}
            formatPrice={billing.formatPrice}
            onClose={closeUpgradeModal}
          />
        ) : null}
      </>
    </SettingsShell>
  )
}
