import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ModalOverlay, PageTitle } from '@/shared/ui'
import type { Product, Subscription } from '../../api'
import { getBillingHeaderSubtitle } from '../../model/billing-copy'
import { BillingPricingPlans } from '../plans/billing-pricing-plans'

type SettingsBillingUpgradeModalProps = {
  hasActiveSubscription: boolean
  inTrial: boolean
  trialEndsAt: string | null
  canAccess: boolean
  formatDate: (dateString: string) => string
  isLoading: boolean
  subscription: Subscription | null
  basicMonthlyProduct?: Product
  basicYearlyProduct?: Product
  proMonthlyProduct?: Product
  proYearlyProduct?: Product
  basicYearlySavings: number
  proYearlySavings: number
  isCreatingCheckout: boolean
  flowPending?: boolean
  keyPersonTrialColumn?: {
    onStartTrial: () => void
    isPending: boolean
  }
  onSubscribe: (tier: 'basic' | 'pro', interval: 'monthly' | 'yearly') => void
  formatPrice: (amount: number, currency: string) => string
  onClose: () => void
  footerContent?: ReactNode
}

export function SettingsBillingUpgradeModal({
  hasActiveSubscription,
  inTrial,
  trialEndsAt,
  canAccess,
  formatDate,
  isLoading,
  subscription,
  basicMonthlyProduct,
  basicYearlyProduct,
  proMonthlyProduct,
  proYearlyProduct,
  basicYearlySavings,
  proYearlySavings,
  isCreatingCheckout,
  flowPending,
  keyPersonTrialColumn,
  onSubscribe,
  formatPrice,
  onClose,
  footerContent,
}: SettingsBillingUpgradeModalProps) {
  const { t } = useTranslation()

  return (
    <ModalOverlay
      onBackdropClick={onClose}
      containerClassName="items-start py-6 sm:py-10"
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-ep-border-card bg-ep-surface shadow-2xl">
        <div className="relative border-b border-slate-200 px-6 py-5 dark:border-ep-border-card">
          <div className="mx-auto max-w-3xl space-y-1 text-center">
            <PageTitle as="h2" align="center">
              {t('settings.billing.upgradeModal.title')}
            </PageTitle>
            <p className="typo-body-sm text-slate-600 dark:text-slate-300">
              {getBillingHeaderSubtitle({
                hasActiveSubscription,
                inTrial,
                trialEndsAt,
                canAccess,
                formatDate,
                t,
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-slate-100"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-6">
          <BillingPricingPlans
            isLoading={isLoading}
            subscription={subscription}
            hasActiveSubscription={hasActiveSubscription}
            basicMonthlyProduct={basicMonthlyProduct}
            basicYearlyProduct={basicYearlyProduct}
            proMonthlyProduct={proMonthlyProduct}
            proYearlyProduct={proYearlyProduct}
            basicYearlySavings={basicYearlySavings}
            proYearlySavings={proYearlySavings}
            isCreatingCheckout={isCreatingCheckout}
            flowPending={flowPending}
            keyPersonTrialColumn={keyPersonTrialColumn}
            onSubscribe={onSubscribe}
            formatPrice={formatPrice}
          />
        </div>

        {footerContent ? (
          <div className="border-t border-slate-200 px-6 py-4 dark:border-ep-border-card">
            {footerContent}
          </div>
        ) : null}
      </div>
    </ModalOverlay>
  )
}
