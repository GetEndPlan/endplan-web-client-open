import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { createBillingUpgradeModalState } from '../model/upgrade-modal-route'
import { cn } from '@/shared/lib/cn'

type SubscriptionAccessBannerProps = {
  message: string
  tone?: 'warning' | 'expired'
  className?: string
}

export function BillingUpgradeLink({ className }: { className?: string }) {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <Link
      to={ROUTES.SETTINGS_BILLING_UPGRADE}
      state={createBillingUpgradeModalState(location)}
      className={cn('typo-emphasis underline underline-offset-2 whitespace-nowrap', className)}
    >
      {t('billing.actions.upgrade')}
    </Link>
  )
}

export function SubscriptionAccessBanner({
  message,
  tone = 'warning',
  className,
}: SubscriptionAccessBannerProps) {
  const toneClasses =
    tone === 'expired'
      ? 'border-[#f2b8b8] bg-[#FDDBDB] text-red-900 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-100'
      : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100'

  const linkClasses =
    tone === 'expired'
      ? 'hover:text-red-950 dark:hover:text-red-50'
      : 'hover:text-amber-950 dark:hover:text-amber-50'

  return (
    <p
      className={cn(
        'rounded-lg border px-4 py-3 typo-body-sm',
        toneClasses,
        className,
      )}
    >
      {message}{' '}
      <BillingUpgradeLink className={linkClasses} />
    </p>
  )
}
