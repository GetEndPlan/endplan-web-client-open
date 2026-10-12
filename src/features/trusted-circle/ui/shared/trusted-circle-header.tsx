import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { PageTitle } from '@/shared/ui'

type TrustedCircleHeaderProps = {
  memberCount: number
  maxMembers: number
  atLimit: boolean
  showPlanLimits: boolean
  /** Subscription lapsed: show read-only notice with renew link */
  subscriptionReadOnly?: boolean
}

export function TrustedCircleHeader({
  memberCount,
  maxMembers,
  atLimit,
  showPlanLimits,
}: TrustedCircleHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <PageTitle>{t('trustedCircle.title')}</PageTitle>
        <p className="mt-1 typo-body-sm text-slate-600 dark:text-slate-400">
          {showPlanLimits
            ? `${memberCount} of ${maxMembers} key persons · ${t('trustedCircle.subtitle')}`
            : t('trustedCircle.subtitle')}
        </p>
        {atLimit && (
          <p className="mt-1 typo-body-sm text-amber-600 dark:text-amber-400">
            Plan limit reached.{' '}
            <Link to={ROUTES.BILLING} className="underline typo-emphasis">
              Upgrade
            </Link>{' '}
            to invite more key persons.
          </p>
        )}
      </div>
    </div>
  )
}
