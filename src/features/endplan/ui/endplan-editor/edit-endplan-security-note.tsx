import { useTranslation } from 'react-i18next'

export function EditEndPlanSecurityNote() {
  const { t } = useTranslation()

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex gap-3">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="typo-body-sm text-blue-800 dark:text-blue-200">
          <p className="typo-emphasis mb-1">{t('endplan.encryption.title')}</p>
          <p>{t('endplan.encryption.descriptionEdit')}</p>
        </div>
      </div>
    </div>
  )
}
