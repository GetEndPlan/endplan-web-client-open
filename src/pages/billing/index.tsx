import {
  BillingHeader,
  CurrentSubscriptionCard,
  CancelSubscriptionModal,
  BillingPricingPlans,
} from '@/features/billing'
import { useBillingPage } from '@/features/billing/hooks/use-billing-page'

export function BillingPage() {
  const {
    user,
    subscription,
    hasActiveSubscription,
    inTrial,
    trialEndsAt,
    canAccess,
    showCancelConfirm,
    setShowCancelConfirm,
    handleSubscribe,
    handleManageSubscription,
    handleCancelSubscription,
    formatPrice,
    formatDate,
    basicMonthlyProduct: bm,
    basicYearlyProduct: by,
    proMonthlyProduct: pm,
    proYearlyProduct: py,
    basicYearlySavings,
    proYearlySavings,
    isLoading,
    isCreatingCheckout,
    isCanceling,
  } = useBillingPage()

  if (!user) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6 lg:pt-0">
      <BillingHeader
        hasActiveSubscription={hasActiveSubscription}
        inTrial={inTrial}
        trialEndsAt={trialEndsAt}
        canAccess={canAccess}
        formatDate={formatDate}
      />

      <CurrentSubscriptionCard
        subscription={subscription}
        inTrial={inTrial}
        trialEndsAt={trialEndsAt}
        canAccess={canAccess}
        formatDate={formatDate}
        onManageSubscription={handleManageSubscription}
        onRequestCancel={() => setShowCancelConfirm(true)}
      />

      <CancelSubscriptionModal
        isOpen={showCancelConfirm}
        periodEnd={subscription?.currentPeriodEnd ?? null}
        formatDate={formatDate}
        isCanceling={isCanceling}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubscription}
      />

      <BillingPricingPlans
        isLoading={isLoading}
        subscription={subscription}
        hasActiveSubscription={hasActiveSubscription}
        basicMonthlyProduct={bm}
        basicYearlyProduct={by}
        proMonthlyProduct={pm}
        proYearlyProduct={py}
        basicYearlySavings={basicYearlySavings}
        proYearlySavings={proYearlySavings}
        isCreatingCheckout={isCreatingCheckout}
        onSubscribe={handleSubscribe}
        formatPrice={formatPrice}
      />
    </div>
  )
}
