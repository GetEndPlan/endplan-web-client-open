import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import type { Subscription } from '../../api'

type CurrentSubscriptionCardProps = {
  subscription: Subscription | null
  inTrial: boolean
  trialEndsAt: string | null
  canAccess: boolean
  formatDate: (dateString: string) => string
  onManageSubscription: () => void
  onRequestCancel: () => void
}

function formatPlanName(
  subscription: Subscription,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const tierLabel = subscription.tier
    ? t(`billing.currentPlan.tier.${subscription.tier}`)
    : t('billing.currentPlan.tier.paid')
  const intervalLabel = subscription.billingInterval === 'year'
    ? t('billing.currentPlan.interval.yearly')
    : t('billing.currentPlan.interval.monthly')
  return t('billing.currentPlan.planName', { tier: tierLabel, interval: intervalLabel })
}

export function CurrentSubscriptionCard({
  subscription,
  inTrial,
  trialEndsAt,
  canAccess,
  formatDate,
  onManageSubscription,
  onRequestCancel,
}: CurrentSubscriptionCardProps) {
  const { t } = useTranslation()
  const description = subscription
    ? t('billing.currentPlan.paidDescription', { plan: formatPlanName(subscription, t) })
    : inTrial
      ? t('billing.currentPlan.trialDescription')
      : !canAccess
        ? t('billing.currentPlan.inactiveDescription')
        : t('billing.currentPlan.noneDescription')

  const subline = subscription
    ? subscription.cancelAtPeriodEnd
      ? t('billing.currentPlan.cancelsOn', { date: formatDate(subscription.currentPeriodEnd) })
      : t('billing.currentPlan.renewsOn', { date: formatDate(subscription.currentPeriodEnd) })
    : inTrial && trialEndsAt
      ? t('billing.currentPlan.trialEndsOn', { date: formatDate(trialEndsAt) })
      : null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-ep-surface-panel sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('billing.currentPlan.title')}</p>
          <p className="typo-body-sm text-slate-900 dark:text-slate-100">
            {description}
          </p>
          {subline && (
            <p className="mt-1 typo-caption text-slate-500 dark:text-slate-400">{subline}</p>
          )}
        </div>

        {subscription ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={onManageSubscription}
            >
              {t('billing.actions.manage')}
            </Button>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                onClick={onRequestCancel}
              >
                {t('billing.actions.cancel')}
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="border-slate-200 text-slate-400 dark:border-slate-600 dark:text-slate-500"
            disabled
          >
            {t('billing.actions.manage')}
          </Button>
        )}
      </div>
    </div>
  )
}
