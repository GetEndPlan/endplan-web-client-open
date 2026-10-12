import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { Card } from '@/shared/ui'

type SharedWithMeLockedStateProps = {
  onNavigate: (path: string) => void
}

export function SharedWithMeLockedState({ onNavigate }: SharedWithMeLockedStateProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="py-12 px-4 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          {t('dashboard.unlock.subtitle')}
        </p>
        <p className="mt-2 typo-body-sm text-slate-500 dark:text-slate-400">
          {t('dashboard.unlock.title')}
        </p>
        <button
          onClick={() => onNavigate(ROUTES.DASHBOARD)}
          className="mt-4 text-ep-primary dark:text-ep-primary-accent hover:underline"
        >
          {t('common.back')} {t('nav.dashboard')}
        </button>
      </div>
    </Card>
  )
}
