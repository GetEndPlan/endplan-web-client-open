import { useTranslation } from 'react-i18next'
import { getBillingHeaderSubtitle } from '../../model/billing-copy'

type BillingHeaderProps = {
  hasActiveSubscription: boolean
  inTrial: boolean
  trialEndsAt: string | null
  canAccess: boolean
  formatDate: (dateString: string) => string
}

export function BillingHeader({
  hasActiveSubscription,
  inTrial,
  trialEndsAt,
  canAccess,
  formatDate,
}: BillingHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-3xl space-y-1 text-center">
      <h1 className="typo-heading-page text-slate-900 dark:text-slate-100">{t('billing.header.title')}</h1>
      <p className="typo-body-sm text-slate-600 dark:text-slate-400">
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
  )
}
