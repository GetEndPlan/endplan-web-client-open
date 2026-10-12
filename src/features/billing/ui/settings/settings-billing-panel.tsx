import { useTranslation } from 'react-i18next'
import { Button, Card, settingsSubCardClassName, settingsSubCardPaddingClassName } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { Subscription } from '../../api'
import { SettingsBillingCancelModal } from './settings-billing-cancel-modal'

function formatPlanName(
  tier: 'basic' | 'pro' | undefined,
  interval: 'month' | 'year' | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!tier || !interval) {
    return t('billing.currentPlan.tier.paid')
  }

  return t('billing.currentPlan.planName', {
    tier: t(`billing.currentPlan.tier.${tier}`),
    interval:
      interval === 'year'
        ? t('billing.currentPlan.interval.yearly')
        : t('billing.currentPlan.interval.monthly'),
  })
}

type SettingsBillingPanelProps = {
  subscription: Subscription | null
  inTrial: boolean
  trialEndsAt: string | null
  canAccess: boolean
  showCancelConfirm: boolean
  setShowCancelConfirm: (open: boolean) => void
  handleManageSubscription: () => Promise<void>
  handleCancelSubscription: () => Promise<void>
  formatDate: (dateString: string) => string
  basicYearlySavings: number
  proYearlySavings: number
  isCanceling: boolean
  onUpgrade: () => void
}

export function SettingsBillingPanel({
  subscription,
  inTrial,
  trialEndsAt,
  canAccess,
  showCancelConfirm,
  setShowCancelConfirm,
  handleManageSubscription,
  handleCancelSubscription,
  formatDate,
  basicYearlySavings,
  proYearlySavings,
  isCanceling,
  onUpgrade,
}: SettingsBillingPanelProps) {
  const { t } = useTranslation()

  const annualSavings = Math.max(basicYearlySavings, proYearlySavings)
  const currentPlanDescription = subscription
    ? t('billing.currentPlan.paidDescription', {
        plan: formatPlanName(subscription.tier, subscription.billingInterval, t),
      })
    : inTrial
      ? t('billing.currentPlan.trialDescription')
      : !canAccess
        ? t('billing.currentPlan.inactiveDescription')
        : t('billing.currentPlan.noneDescription')

  const currentPlanSubline = subscription
    ? subscription.cancelAtPeriodEnd
      ? t('billing.currentPlan.cancelsOn', { date: formatDate(subscription.currentPeriodEnd) })
      : t('billing.currentPlan.renewsOn', { date: formatDate(subscription.currentPeriodEnd) })
    : inTrial && trialEndsAt
      ? t('billing.currentPlan.trialEndsOn', { date: formatDate(trialEndsAt) })
      : null

  const handleManage = () => {
    if (subscription) {
      void handleManageSubscription()
      return
    }
    onUpgrade()
  }

  const canCancelSubscription = subscription != null && !subscription.cancelAtPeriodEnd

  return (
    <Card className="p-6">
      <h2 className="mb-6 typo-heading-card text-slate-900 dark:text-slate-100">
        {t('nav.billing')}
      </h2>

      <div className="space-y-6">
        <div className={cn(settingsSubCardClassName, settingsSubCardPaddingClassName, 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between')}>
          <div className="space-y-1">
            <p className="typo-body-md text-slate-900 dark:text-slate-100">
              {annualSavings > 0
                ? t('settings.billing.upgradeBanner', { percent: annualSavings })
                : t('settings.billing.upgradeBannerFallback')}
            </p>
          </div>
          <Button variant="secondary" onClick={onUpgrade}>
            {t('settings.billing.upgradeNow')}
          </Button>
        </div>

        <div className={cn(settingsSubCardClassName, settingsSubCardPaddingClassName, 'flex flex-col gap-4')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                {t('billing.currentPlan.title')}
              </p>
              <p className="typo-body-md-emphasis text-slate-900 dark:text-slate-100">
                {currentPlanDescription}
              </p>
              {currentPlanSubline ? (
                <p className="typo-body-sm text-slate-600 dark:text-slate-300">
                  {currentPlanSubline}
                </p>
              ) : null}
            </div>

            <Button variant="secondary" onClick={handleManage}>
              {t('billing.actions.manage')}
            </Button>
          </div>
        </div>

        <div className={cn(settingsSubCardClassName, settingsSubCardPaddingClassName, 'flex flex-col gap-4')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">
                {t('settings.billing.cancellationTitle')}
              </h3>
              <p className="typo-body-sm text-slate-600 dark:text-slate-300">
                {canCancelSubscription
                  ? t('settings.billing.cancellationDescription')
                  : t('settings.billing.cancellationUnavailable')}
              </p>
            </div>

            {canCancelSubscription ? (
              <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
                {t('billing.actions.cancel')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <SettingsBillingCancelModal
        isOpen={showCancelConfirm}
        isCanceling={isCanceling}
        periodEnd={subscription?.currentPeriodEnd ?? null}
        formatDate={formatDate}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          void handleCancelSubscription()
        }}
      />
    </Card>
  )
}
