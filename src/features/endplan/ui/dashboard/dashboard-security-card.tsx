import { EndPlanIcon } from '@/shared/ui'
import { useTranslation } from 'react-i18next'

export function DashboardSecurityCard() {
  const { t } = useTranslation()

  return (
    <div className="flex w-full min-w-0 flex-col justify-between rounded-ep-card border border-ep-border-card bg-ep-surface p-4 lg:flex-[3] lg:p-5">
      <div className="flex items-start justify-between gap-2 lg:gap-3">
        <div>
          <p className="typo-caption text-ep-body/60 dark:text-white/70 lg:typo-body-sm">
            {t('dashboard.security.title')}
          </p>
          <p className="mt-0.5 typo-heading-card text-ep-body dark:text-white lg:mt-1 lg:typo-heading-section">
            {t('dashboard.security.protected')}
          </p>
        </div>
        <EndPlanIcon name="security" size={24} className="size-6 shrink-0 lg:size-8" />
      </div>
      <hr className="my-2 border-ep-border dark:border-ep-border lg:my-3" />
      <ul className="space-y-0.5 lg:space-y-1 2xl:flex 2xl:flex-wrap 2xl:items-center 2xl:gap-x-4 2xl:gap-y-1 2xl:space-y-0">
        {[t('dashboard.security.lastBackup'), t('dashboard.security.encryptionActive')].map((item) => (
          <li key={item} className="flex items-center gap-1.5 typo-caption text-ep-body/70 dark:text-white/80 lg:typo-body-sm">
            <EndPlanIcon name="check" size={24} className="size-3.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
