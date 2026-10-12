import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type SharedVaultInactivityReleaseBannerProps = {
  ownerName: string
  inactivityDays: number
}

export function SharedVaultInactivityReleaseBanner({
  ownerName,
  inactivityDays,
}: SharedVaultInactivityReleaseBannerProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-slate-300 bg-slate-100 px-5 py-4 dark:border-slate-600 dark:bg-slate-700/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="typo-heading-card text-slate-900 dark:text-slate-50">
            {t('sharedVault.inactivityBanner.title', {
              name: ownerName,
              days: inactivityDays,
            })}
          </p>
          <p className="mt-1 typo-body-base text-slate-700 dark:text-slate-200">
            {t('sharedVault.inactivityBanner.subtitle', {
              name: ownerName,
            })}
          </p>
        </div>

        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-500 text-white dark:bg-slate-400">
          <AlertCircle className="h-4 w-4" />
        </div>
      </div>
    </section>
  )
}
