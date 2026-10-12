import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { createBillingUpgradeModalState } from '@/features/billing'

type DashboardHeaderProps = {
  userName: string
  stillLoading: boolean
  isCreated: boolean
}

export function DashboardHeader({
  userName,
  stillLoading,
  isCreated,
}: DashboardHeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()

  const subtitle = stillLoading
    ? t('dashboard.loading')
    : isCreated
      ? t('dashboard.hasEndPlan')
      : t('dashboard.hasSharedOnly')

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="typo-heading-page-static text-ep-body dark:text-white">
          {t('dashboard.greeting', { name: userName })}
        </h1>
        <p className="mt-1 typo-body-sm text-ep-body/60 dark:text-white/70">{subtitle}</p>
      </div>
      {!stillLoading ? (
        <Link
          to={ROUTES.SETTINGS_BILLING_UPGRADE}
          state={createBillingUpgradeModalState(location)}
          className="inline-flex shrink-0 self-start items-center justify-center rounded-ep-button bg-ep-primary px-4 py-2 typo-button-md text-white transition hover:bg-ep-primary-accent sm:self-auto"
        >
          {t('nav.upgradePlan')}
        </Link>
      ) : null}
    </div>
  )
}
