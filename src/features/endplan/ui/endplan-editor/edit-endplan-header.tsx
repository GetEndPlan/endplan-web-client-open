import { useTranslation } from 'react-i18next'

type EditEndPlanHeaderProps = {
  hasUnsavedChanges: boolean
  onBack: () => void
}

export function EditEndPlanHeader({ hasUnsavedChanges, onBack }: EditEndPlanHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        onClick={onBack}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('common.backToDashboard')}
      </button>
      {hasUnsavedChanges && (
        <span className="typo-body-sm text-amber-600 dark:text-amber-400">{t('endplan.edit.unsavedChanges')}</span>
      )}
    </div>
  )
}
