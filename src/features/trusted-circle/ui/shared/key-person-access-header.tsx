import { useTranslation } from 'react-i18next'

export function KeyPersonAccessHeader() {
  const { t } = useTranslation()

  return (
    <header>
      <p className="typo-caption-emphasis uppercase tracking-[0.14em] text-ep-primary dark:text-ep-primary-accent">
        {t('trustedCircle.keyPersonAccess.kicker')}
      </p>
      <h1 className="mt-3 typo-heading-section text-slate-950 dark:text-slate-50">
        {t('trustedCircle.keyPersonAccess.title')}
      </h1>
      <p className="mt-3 max-w-2xl typo-body-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {t('trustedCircle.keyPersonAccess.subtitle')}
      </p>
    </header>
  )
}
